// Traduit une adresse du site en PageModel (ce que les robots doivent lire sur la page),
// à partir des fiches publiées dans la base. Une fiche absente ou non publiée = 404.
import { fetchMany, fetchPublishedBySlug, localizeRowsSync } from "./db.js";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  hotelJsonLd,
  itemListJsonLd,
  organizationJsonLd,
  productJsonLd,
  websiteJsonLd,
} from "./jsonLd.js";
import { NOT_FOUND, PASSTHROUGH, type PageLink, type PageModel, type PageSection } from "./model.js";
import { BRAND, brandDescription, href, ui, type PageLang } from "./site.js";
import { SEO_HOME_AND_LIST, STATIC_ALIASES, staticText } from "./staticPages.js";
import { articleBlocks, formatPrice, metaDescription, oneLine, paragraphs, stripHtml, toList } from "./text.js";
import { experiencePageTitle, hotelPageTitle } from "./titles.js";

type Row = Record<string, any>;

// Copie de src/lib/boatsCategory.ts (les fichiers de api/ ne lisent pas src/).
const BOATS_CATEGORY_ID = "06434e23-29f4-4c6b-ba63-b61e68879520";

const EXPERIENCE_PRICE_COLUMNS =
  "base_price,currency,pricing_model,room_net_rate,bar_rate_markup_value,bar_rate_markup_is_pct,experience_sell_fixed,experience_sell_per_person,min_party";

// ---------------------------------------------------------------------------
// Prix « à partir de »
// ---------------------------------------------------------------------------

// Pour les expériences vendues avec une chambre d'hôtel ("bar_rate"), il n'y a pas de prix
// fixe stocké : le vrai prix dépend de la chambre au moment de la réservation
// (src/hooks/useExperience2Price.ts). On reprend la même estimation « à partir de » que le
// site utilise en secours, pour ne jamais annoncer un prix à 0.
function experienceFromPrice(row: Row): number | null {
  if (Number(row.base_price) > 0) return Number(row.base_price);
  if (row.pricing_model !== "bar_rate") return null;
  const netRate = Number(row.room_net_rate) || 0;
  if (netRate <= 0) return null;
  const markupValue = Number(row.bar_rate_markup_value) || 0;
  const isPct = row.bar_rate_markup_is_pct ?? true;
  const roomClient = isPct ? netRate + (netRate * markupValue) / 100 : netRate + markupValue;
  const sellFixed = Number(row.experience_sell_fixed) || 0;
  const sellPerPerson = Number(row.experience_sell_per_person) || 0;
  const minParty = Number(row.min_party) || 1;
  const total = roomClient + sellFixed + sellPerPerson * minParty;
  return total > 0 ? Math.round(total * 100) / 100 : null;
}

function priceNote(price: number | null, currency: string, lang: PageLang, perPerson = false): string | undefined {
  if (price == null || price <= 0) return undefined;
  const t = ui(lang);
  return `${t.from} ${formatPrice(price, currency || "ILS")}${perPerson ? ` ${t.perPerson}` : ""}`;
}

async function fetchRating(experienceId: string): Promise<{ ratingValue: number; reviewCount: number } | null> {
  const rows = await fetchMany(
    "experience2_reviews",
    "rating",
    `experience_id=eq.${encodeURIComponent(experienceId)}&is_visible=eq.true`
  );
  if (!rows.length) return null;
  const sum = rows.reduce((acc, r) => acc + Number(r.rating || 0), 0);
  return { ratingValue: Math.round((sum / rows.length) * 10) / 10, reviewCount: rows.length };
}


// Équipements HyperGuest : on garde ceux de l'hôtel (pas ceux des chambres), sans doublons,
// et sans les mentions trop banales pour aider un voyageur.
const TRIVIAL_FACILITIES = new Set(["non-smoking rooms", "designated smoking area", "heating", "safe", "ironing service", "bottle of water", "shoeshine"]);
function hyperguestAmenities(facilities: unknown): string[] {
  if (!Array.isArray(facilities)) return [];
  const names = facilities
    .filter((f: any) => f && typeof f.name === "string" && (!f.type || f.type === "hotel"))
    .map((f: any) => String(f.name).trim())
    .filter((name) => name && !TRIVIAL_FACILITIES.has(name.toLowerCase()));
  return [...new Set(names)];
}

// ---------------------------------------------------------------------------
// Listes réutilisées (liens internes)
// ---------------------------------------------------------------------------

async function publishedCategories(lang: PageLang): Promise<Row[]> {
  const rows = await fetchMany(
    "categories",
    "id,slug,name,name_fr,name_he,launch_description,launch_description_fr,launch_description_he,display_order",
    "status=eq.published&order=display_order.asc"
  );
  return localizeRowsSync(rows.filter((r) => r.slug && r.slug !== "bateaux"), lang);
}

function experienceLink(row: Row, lang: PageLang): PageLink {
  return {
    label: row.title,
    href: href(`/experience/${row.slug}`, lang),
    note: [oneLine(row.subtitle, 140), priceNote(experienceFromPrice(row), row.currency, lang)].filter(Boolean).join(" · ") || undefined,
  };
}

function standaloneLink(row: Row, lang: PageLang): PageLink {
  return {
    label: row.title,
    href: href(`${row.category_id === BOATS_CATEGORY_ID ? "/boat" : "/standalone-experience"}/${row.slug}`, lang),
    note: [oneLine(row.subtitle, 140), priceNote(Number(row.base_price) || null, row.currency, lang, row.base_price_type === "per_person")]
      .filter(Boolean)
      .join(" · ") || undefined,
  };
}

function hotelLink(row: Row, lang: PageLang): PageLink {
  return { label: row.name, href: href(`/hotel/${row.slug}`, lang), note: [row.city, row.region].filter(Boolean).join(", ") || undefined };
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

async function resolveHome(lang: PageLang): Promise<PageModel> {
  const t = ui(lang);
  const [categories, experiences, standalones, hotels] = await Promise.all([
    publishedCategories(lang),
    fetchMany("experiences2", `id,slug,title,title_fr,title_he,subtitle,subtitle_fr,subtitle_he,${EXPERIENCE_PRICE_COLUMNS}`, "status=eq.published&order=display_order.asc.nullslast"),
    fetchMany("standalone_experiences", "slug,category_id,title,title_fr,title_he,subtitle,subtitle_fr,subtitle_he,base_price,base_price_type,currency", "status=eq.published&order=display_order.asc.nullslast"),
    fetchMany("hotels2", "slug,name,name_fr,name_he,city,city_fr,city_he,region,region_fr,region_he", "status=eq.published&order=name.asc"),
  ]);
  const seo = SEO_HOME_AND_LIST.home[lang];
  return {
    status: 200,
    title: seo.title,
    description: metaDescription(seo.description),
    h1: lang === "fr" ? "Hôtels-boutiques et expériences choisis en Israël" : lang === "he" ? "מלונות בוטיק וחוויות נבחרות בישראל" : "Handpicked boutique hotels and experiences in Israel",
    intro: [seo.description, brandDescription(lang)],
    sections: [
      { heading: t.categories, links: categories.map((c) => ({ label: c.name, href: href(`/category/${c.slug}`, lang), note: oneLine(c.launch_description, 140) || undefined })) },
      { heading: `${t.experiences} · ${t.withHotel}`, links: localizeRowsSync(experiences, lang).map((r) => experienceLink(r, lang)) },
      { heading: `${t.experiences} · ${t.experienceOnly}`, links: localizeRowsSync(standalones, lang).map((r) => standaloneLink(r, lang)) },
      { heading: t.hotels, links: localizeRowsSync(hotels, lang).map((r) => hotelLink(r, lang)) },
    ],
    jsonLd: [organizationJsonLd(), websiteJsonLd()],
  };
}

async function resolveExperiencesList(lang: PageLang): Promise<PageModel> {
  const t = ui(lang);
  const [experiences, standalones] = await Promise.all([
    fetchMany("experiences2", `slug,title,title_fr,title_he,subtitle,subtitle_fr,subtitle_he,${EXPERIENCE_PRICE_COLUMNS}`, "status=eq.published&order=display_order.asc.nullslast"),
    fetchMany("standalone_experiences", "slug,category_id,title,title_fr,title_he,subtitle,subtitle_fr,subtitle_he,base_price,base_price_type,currency", "status=eq.published&order=display_order.asc.nullslast"),
  ]);
  const seo = SEO_HOME_AND_LIST.experiences[lang];
  const withHotel = localizeRowsSync(experiences, lang).map((r) => experienceLink(r, lang));
  const alone = localizeRowsSync(standalones, lang).map((r) => standaloneLink(r, lang));
  return {
    status: 200,
    title: seo.title,
    description: metaDescription(seo.description),
    h1: t.experiences,
    intro: [seo.description],
    breadcrumbs: [{ name: t.home, path: "/" }, { name: t.experiences, path: "/experiences" }],
    sections: [
      { heading: t.withHotel, links: withHotel },
      { heading: t.experienceOnly, links: alone },
    ],
    jsonLd: [
      itemListJsonLd(t.experiences, "/experiences", [
        ...experiences.map((r) => ({ name: r.title, path: `/experience/${r.slug}` })),
        ...standalones.map((r) => ({ name: r.title, path: `${r.category_id === BOATS_CATEGORY_ID ? "/boat" : "/standalone-experience"}/${r.slug}` })),
      ]),
    ],
  };
}

async function resolveHotel(slug: string, lang: PageLang): Promise<PageModel> {
  const t = ui(lang);
  const row = await fetchPublishedBySlug(
    "hotels2",
    "id,slug,name,name_fr,name_he,city,city_fr,city_he,region,region_fr,region_he,address,address_fr,address_he,story,story_fr,story_he,description_location,description_location_fr,description_location_he,description_room,description_room_fr,description_room_he,highlights,highlights_fr,highlights_he,amenities,amenities_fr,amenities_he,star_rating,hero_image,og_image,latitude,longitude,seo_title_en,seo_title_fr,seo_title_he,meta_description_en,meta_description_fr,meta_description_he,check_in_time,check_out_time,hyperguest_facilities",
    slug,
    lang
  );
  if (!row) return NOT_FOUND;

  const expColumns = `id,slug,status,title,title_fr,title_he,subtitle,subtitle_fr,subtitle_he,${EXPERIENCE_PRICE_COLUMNS}`;
  const [direct, linked] = await Promise.all([
    fetchMany("experiences2", expColumns, `hotel_id=eq.${row.id}&status=eq.published`),
    fetchMany("experience2_hotels", `experiences2(${expColumns})`, `hotel_id=eq.${row.id}`),
  ]);
  const byId = new Map<string, Row>();
  for (const e of [...direct, ...linked.map((l) => l.experiences2).filter(Boolean)]) {
    if (e.status === "published") byId.set(e.id, e);
  }
  const experiences = localizeRowsSync([...byId.values()], lang);

  const highlights = toList(row.highlights);
  // Équipements saisis à la main, sinon ceux fournis par HyperGuest (équipements de l'hôtel, pas des chambres).
  const amenities = toList(row.amenities).length ? toList(row.amenities) : hyperguestAmenities(row.hyperguest_facilities);
  const story = paragraphs(row.story);
  const fallbackDescription = `${row.name}${row.star_rating ? `, ${row.star_rating}-star` : ""} hotel${row.city ? ` in ${row.city}, Israel` : " in Israel"}, curated by STAYMAKOM${experiences.length ? ` with ${experiences.map((e) => e.title).slice(0, 2).join(" and ")}` : ""}.`;
  const description = metaDescription(row.meta_description_en, row.story, row.description_location, fallbackDescription);
  const location = row.address || [row.city, row.region].filter(Boolean).join(", ");

  const crumbs = [{ name: t.home, path: "/" }, { name: row.name, path: `/hotel/${row.slug}` }];
  return {
    status: 200,
    canonicalPath: `/hotel/${row.slug}`,
    title: hotelPageTitle(row.name, row.city, lang, row.seo_title_en),
    description,
    image: row.og_image || row.hero_image || undefined,
    h1: row.name,
    intro: story.length ? story : [description || fallbackDescription],
    facts: [
      ...(location ? [{ label: t.location, value: location }] : []),
      ...(row.star_rating ? [{ label: t.hotel, value: `${row.star_rating} ${t.stars}` }] : []),
    ],
    breadcrumbs: crumbs,
    sections: [
      ...(experiences.length ? [{ heading: t.experiencesHere, links: experiences.map((e) => experienceLink(e, lang)) }] : []),
      ...(highlights.length ? [{ heading: t.highlights, list: highlights }] : []),
      ...(paragraphs(row.description_location).length ? [{ heading: t.location, paragraphs: paragraphs(row.description_location) }] : []),
      ...(paragraphs(row.description_room).length ? [{ heading: t.rooms, paragraphs: paragraphs(row.description_room) }] : []),
      ...(amenities.length ? [{ heading: t.amenities, list: amenities.slice(0, 30) }] : []),
    ],
    jsonLd: [hotelJsonLd(row, description, amenities), breadcrumbJsonLd(crumbs)],
  };
}

async function resolveExperience(slug: string, lang: PageLang): Promise<PageModel> {
  const t = ui(lang);
  const row = await fetchPublishedBySlug(
    "experiences2",
    `id,slug,title,title_fr,title_he,subtitle,subtitle_fr,subtitle_he,long_copy,long_copy_fr,long_copy_he,duration,duration_fr,duration_he,address,address_fr,address_he,includes,includes_fr,includes_he,not_includes,not_includes_fr,not_includes_he,good_to_know,good_to_know_fr,good_to_know_he,hero_image,og_image,seo_title_en,seo_title_fr,seo_title_he,meta_description_en,meta_description_fr,meta_description_he,${EXPERIENCE_PRICE_COLUMNS},hotel_id,hotels2(name,name_fr,name_he,slug,city,city_fr,city_he,region),categories(name,name_fr,name_he,slug)`,
    slug,
    lang
  );
  if (!row) return NOT_FOUND;

  const [includeRows, rating] = await Promise.all([
    fetchMany("experience2_includes", "title,title_fr,title_he,order_index", `experience_id=eq.${row.id}&published=eq.true&order=order_index.asc`),
    fetchRating(row.id),
  ]);
  const hotel = Array.isArray(row.hotels2) ? row.hotels2[0] : row.hotels2;
  if (hotel) localizeRowsSync([hotel], lang);
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  if (category) localizeRowsSync([category], lang);

  const included = includeRows.length ? toList(localizeRowsSync(includeRows, lang)) : toList(row.includes);
  const price = experienceFromPrice(row);
  const description = metaDescription(row.meta_description_en, row.subtitle, row.long_copy);
  const crumbs = [
    { name: t.home, path: "/" },
    ...(category?.slug ? [{ name: category.name, path: `/category/${category.slug}` }] : [{ name: t.experiences, path: "/experiences" }]),
    { name: row.title, path: `/experience/${row.slug}` },
  ];
  const location = [hotel?.name, hotel?.city || row.address].filter(Boolean).join(", ");

  return {
    status: 200,
    canonicalPath: `/experience/${row.slug}`,
    title: experiencePageTitle(row.title, hotel?.name, lang, row.seo_title_en),
    description,
    image: row.og_image || row.hero_image || undefined,
    h1: row.title,
    intro: [row.subtitle, ...paragraphs(row.long_copy)].filter(Boolean).map(String),
    facts: [
      ...(priceNote(price, row.currency, lang) ? [{ label: t.price, value: priceNote(price, row.currency, lang)! }] : []),
      ...(row.duration ? [{ label: t.duration, value: stripHtml(row.duration) }] : []),
      ...(location ? [{ label: t.location, value: location }] : []),
    ],
    breadcrumbs: crumbs,
    sections: [
      ...(included.length ? [{ heading: t.included, list: included }] : []),
      ...(toList(row.not_includes).length ? [{ heading: t.notIncluded, list: toList(row.not_includes) }] : []),
      ...(toList(row.good_to_know).length ? [{ heading: t.goodToKnow, list: toList(row.good_to_know) }] : []),
      ...(hotel?.slug ? [{ heading: t.hotel, links: [hotelLink(hotel, lang)] }] : []),
      ...(category?.slug ? [{ heading: t.categories, links: [{ label: category.name, href: href(`/category/${category.slug}`, lang) }] }] : []),
    ],
    jsonLd: [
      productJsonLd({
        name: row.title,
        description,
        image: row.hero_image || row.og_image || undefined,
        path: `/experience/${row.slug}`,
        price,
        currency: row.currency || "ILS",
        hotel: hotel?.slug ? { name: hotel.name, slug: hotel.slug } : null,
        rating,
      }),
      breadcrumbJsonLd(crumbs),
    ],
  };
}

async function resolveStandalone(slug: string, lang: PageLang): Promise<PageModel> {
  const t = ui(lang);
  const row = await fetchPublishedBySlug(
    "standalone_experiences",
    "id,slug,title,title_fr,title_he,subtitle,subtitle_fr,subtitle_he,long_copy,long_copy_fr,long_copy_he,duration,duration_fr,duration_he,city,city_fr,city_he,region,region_fr,region_he,address,address_fr,address_he,hide_exact_address,includes,includes_he,not_includes,not_includes_he,good_to_know,good_to_know_he,hero_image,og_image,base_price,base_price_type,currency,seo_title_en,seo_title_fr,seo_title_he,meta_description_en,meta_description_fr,meta_description_he,category_id,categories(name,name_fr,name_he,slug)",
    slug,
    lang
  );
  if (!row) return NOT_FOUND;
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  if (category) localizeRowsSync([category], lang);
  const isBoat = row.category_id === BOATS_CATEGORY_ID;
  const price = Number(row.base_price) > 0 ? Number(row.base_price) : null;
  const perPerson = row.base_price_type === "per_person";
  const description = metaDescription(row.meta_description_en, row.subtitle, row.long_copy);
  // Bateaux : adresse de référence /boat/<slug> ; autres expériences seules : /standalone-experience/<slug>.
  const path = `${isBoat ? "/boat" : "/standalone-experience"}/${row.slug}`;
  const crumbs = [
    { name: t.home, path: "/" },
    isBoat
      ? { name: t.boats, path: "/boat" }
      : category?.slug
        ? { name: category.name, path: `/category/${category.slug}` }
        : { name: t.experiences, path: "/experiences" },
    { name: row.title, path },
  ];
  const location = [row.hide_exact_address ? null : row.address, row.city, row.region].filter(Boolean).join(", ");
  const included = toList(row.includes);

  return {
    status: 200,
    canonicalPath: path,
    title: experiencePageTitle(row.title, null, lang, row.seo_title_en),
    description,
    image: row.og_image || row.hero_image || undefined,
    h1: row.title,
    intro: [row.subtitle, ...paragraphs(row.long_copy)].filter(Boolean).map(String),
    facts: [
      ...(priceNote(price, row.currency, lang, perPerson) ? [{ label: t.price, value: priceNote(price, row.currency, lang, perPerson)! }] : []),
      ...(row.duration ? [{ label: t.duration, value: stripHtml(row.duration) }] : []),
      ...(location ? [{ label: t.location, value: location }] : []),
    ],
    breadcrumbs: crumbs,
    sections: [
      ...(included.length ? [{ heading: t.included, list: included }] : []),
      ...(toList(row.not_includes).length ? [{ heading: t.notIncluded, list: toList(row.not_includes) }] : []),
      ...(toList(row.good_to_know).length ? [{ heading: t.goodToKnow, list: toList(row.good_to_know) }] : []),
      ...(category?.slug && !isBoat ? [{ heading: t.categories, links: [{ label: category.name, href: href(`/category/${category.slug}`, lang) }] }] : []),
    ],
    jsonLd: [
      productJsonLd({
        name: row.title,
        description,
        image: row.hero_image || row.og_image || undefined,
        path,
        price,
        currency: row.currency || "ILS",
      }),
      breadcrumbJsonLd(crumbs),
    ],
  };
}

async function resolveCategory(slug: string, lang: PageLang): Promise<PageModel> {
  const t = ui(lang);
  const row = await fetchPublishedBySlug(
    "categories",
    "id,slug,name,name_fr,name_he,presentation_title,presentation_title_fr,presentation_title_he,intro_rich_text,intro_rich_text_fr,intro_rich_text_he,launch_description,launch_description_fr,launch_description_he,bullets,bullets_he,hero_image,og_image,seo_title_en,seo_title_fr,seo_title_he,meta_description_en,meta_description_fr,meta_description_he",
    slug,
    lang
  );
  if (!row) return NOT_FOUND;
  const standaloneColumns = "id,slug,category_id,title,title_fr,title_he,subtitle,subtitle_fr,subtitle_he,base_price,base_price_type,currency";
  const [experiences, standaloneMain, standaloneExtra] = await Promise.all([
    fetchMany("experiences2", `slug,title,title_fr,title_he,subtitle,subtitle_fr,subtitle_he,${EXPERIENCE_PRICE_COLUMNS}`, `category_id=eq.${row.id}&status=eq.published&order=display_order.asc.nullslast`),
    fetchMany("standalone_experiences", standaloneColumns, `category_id=eq.${row.id}&status=eq.published&order=display_order.asc.nullslast`),
    fetchMany("standalone_experiences", standaloneColumns, `category_ids=cs.${encodeURIComponent(JSON.stringify([row.id]))}&status=eq.published`),
  ]);
  const standaloneById = new Map<string, Row>();
  for (const s of [...standaloneMain, ...standaloneExtra]) standaloneById.set(s.id, s);
  const standalones = [...standaloneById.values()];

  const description = metaDescription(row.meta_description_en, row.intro_rich_text, row.launch_description, `${row.name}: curated hotel experiences in Israel by STAYMAKOM.`);
  const crumbs = [{ name: t.home, path: "/" }, { name: t.experiences, path: "/experiences" }, { name: row.name, path: `/category/${row.slug}` }];
  const sections: PageSection[] = [];
  if (toList(row.bullets).length) sections.push({ list: toList(row.bullets) });
  if (experiences.length) sections.push({ heading: t.withHotel, links: localizeRowsSync(experiences, lang).map((r) => experienceLink(r, lang)) });
  if (standalones.length) sections.push({ heading: t.experienceOnly, links: localizeRowsSync(standalones, lang).map((r) => standaloneLink(r, lang)) });

  return {
    status: 200,
    canonicalPath: `/category/${row.slug}`,
    title: row.seo_title_en || `${row.name} | STAYMAKOM`,
    description,
    image: row.og_image || row.hero_image || undefined,
    h1: row.presentation_title || row.name,
    intro: paragraphs(row.intro_rich_text).length ? paragraphs(row.intro_rich_text) : paragraphs(row.launch_description),
    breadcrumbs: crumbs,
    sections,
    jsonLd: [
      itemListJsonLd(row.name, `/category/${row.slug}`, [
        ...experiences.map((r) => ({ name: r.title, path: `/experience/${r.slug}` })),
        ...standalones.map((r) => ({ name: r.title, path: `${r.category_id === BOATS_CATEGORY_ID ? "/boat" : "/standalone-experience"}/${r.slug}` })),
      ]),
      breadcrumbJsonLd(crumbs),
    ],
  };
}

async function resolveBoats(lang: PageLang): Promise<PageModel> {
  const t = ui(lang);
  const text = staticText("/boat", lang)!;
  const boats = await fetchMany(
    "standalone_experiences",
    "slug,category_id,title,title_fr,title_he,subtitle,subtitle_fr,subtitle_he,base_price,base_price_type,currency",
    `category_id=eq.${BOATS_CATEGORY_ID}&status=eq.published&order=display_order.asc.nullslast`
  );
  const links = localizeRowsSync(boats, lang).map((r) => ({ ...standaloneLink(r, lang), href: href(`/boat/${r.slug}`, lang) }));
  const crumbs = [{ name: t.home, path: "/" }, { name: t.boats, path: "/boat" }];
  return {
    status: 200,
    title: text.title,
    description: metaDescription(text.description),
    h1: text.h1,
    intro: [text.description],
    breadcrumbs: crumbs,
    sections: links.length ? [{ heading: t.boats, links }] : [],
    jsonLd: [itemListJsonLd(text.h1, "/boat", boats.map((r) => ({ name: r.title, path: `/boat/${r.slug}` }))), breadcrumbJsonLd(crumbs)],
  };
}

async function resolveJournalList(lang: PageLang): Promise<PageModel> {
  const t = ui(lang);
  const text = staticText("/journal", lang)!;
  const posts = await fetchMany("journal_posts", "slug,title_en,title_he,excerpt_en,excerpt_he,published_at", "status=eq.published&order=published_at.desc.nullslast");
  localizeRowsSync(posts, lang);
  const crumbs = [{ name: t.home, path: "/" }, { name: t.journal, path: "/journal" }];
  return {
    status: 200,
    title: text.title,
    description: metaDescription(text.description),
    h1: text.h1,
    intro: [text.description],
    breadcrumbs: crumbs,
    sections: [{ heading: t.articles, links: posts.map((p) => ({ label: p.title_en, href: href(`/journal/${p.slug}`, lang), note: oneLine(p.excerpt_en, 160) || undefined })) }],
    jsonLd: [itemListJsonLd(text.h1, "/journal", posts.map((p) => ({ name: p.title_en, path: `/journal/${p.slug}` }))), breadcrumbJsonLd(crumbs)],
  };
}

async function resolveJournalPost(slug: string, lang: PageLang): Promise<PageModel> {
  const t = ui(lang);
  const row = await fetchPublishedBySlug(
    "journal_posts",
    "id,slug,title_en,title_he,excerpt_en,excerpt_he,content_en,content_he,author_name,cover_image,og_image,seo_title_en,seo_title_fr,seo_title_he,meta_description_en,meta_description_fr,meta_description_he,published_at,created_at,updated_at",
    slug,
    lang
  );
  if (!row) return NOT_FOUND;
  // Le premier intertitre reprend souvent le titre de l'article : on l'enlève (un seul H1 par page).
  const sameAsTitle = (text: string) => text.trim().toLowerCase() === String(row.title_en || "").trim().toLowerCase();
  const blocks = articleBlocks(row.content_en).filter((b) => !(b.kind === "h2" && sameAsTitle(b.text)));
  const sections: PageSection[] = [];
  let current: PageSection = { paragraphs: [] };
  for (const block of blocks) {
    if (block.kind === "h2") {
      if (current.heading || current.paragraphs!.length) sections.push(current);
      current = { heading: block.text, paragraphs: [] };
    } else {
      current.paragraphs!.push(block.text);
    }
  }
  if (current.heading || current.paragraphs!.length) sections.push(current);

  const description = metaDescription(row.meta_description_en, row.excerpt_en, blocks.find((b) => b.kind === "p")?.text);
  const crumbs = [{ name: t.home, path: "/" }, { name: t.journal, path: "/journal" }, { name: row.title_en, path: `/journal/${row.slug}` }];
  return {
    status: 200,
    canonicalPath: `/journal/${row.slug}`,
    title: row.seo_title_en || `${row.title_en} | STAYMAKOM`,
    description,
    image: row.og_image || row.cover_image || undefined,
    h1: row.title_en,
    intro: row.excerpt_en ? [stripHtml(row.excerpt_en)] : [],
    facts: [
      ...(row.published_at ? [{ label: t.published, value: String(row.published_at).slice(0, 10) }] : []),
      ...(row.author_name ? [{ label: "", value: row.author_name }] : []),
    ],
    breadcrumbs: crumbs,
    sections,
    jsonLd: [articleJsonLd(row, row.title_en, description), breadcrumbJsonLd(crumbs)],
  };
}

function resolveStatic(path: string, lang: PageLang): PageModel | null {
  const text = staticText(path, lang);
  if (!text) return null;
  const t = ui(lang);
  const intro = [text.description];
  if (path === "/contact" || path === "/legal") {
    intro.push(`${BRAND.legalName}, ${BRAND.address.street}, ${BRAND.address.city}, Israel. ${t.contactLine}: ${BRAND.email}`);
  }
  return {
    status: 200,
    canonicalPath: STATIC_ALIASES[path] || path,
    title: text.title,
    description: metaDescription(text.description),
    h1: text.h1,
    intro,
    breadcrumbs: [{ name: t.home, path: "/" }, { name: text.h1, path: STATIC_ALIASES[path] || path }],
    jsonLd: path === "/about" || path === "/contact" ? [organizationJsonLd()] : [],
  };
}

/**
 * Point d'entrée : adresse demandée → contenu pour les robots.
 * notFound = l'adresse n'existe pas dans le site (décidé par middleware.ts).
 */
export async function resolvePage(pathname: string, lang: PageLang, notFound: boolean): Promise<PageModel> {
  if (notFound) return NOT_FOUND;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const [, section, slug] = path.split("/");
  const key = (section || "").toLowerCase();

  if (path === "/") return resolveHome(lang);
  if (!slug) {
    if (key === "experiences") return resolveExperiencesList(lang);
    if (key === "boat") return resolveBoats(lang);
    if (key === "journal") return resolveJournalList(lang);
    return resolveStatic(`/${key}`, lang) || PASSTHROUGH;
  }
  const decoded = decodeURIComponent(slug);
  switch (key) {
    case "hotel":
    case "hotels":
    case "hotel-old":
      return resolveHotel(decoded, lang);
    case "experience":
    case "experience2":
    case "experience-old":
      return resolveExperience(decoded, lang);
    case "standalone-experience":
      return resolveStandalone(decoded, lang);
    case "boat":
      return resolveStandalone(decoded, lang);
    case "category":
      return resolveCategory(decoded, lang);
    case "journal":
      return resolveJournalPost(decoded, lang);
    default:
      return PASSTHROUGH;
  }
}

/** Catégories publiées, pour le menu et le pied de page de chaque page. */
export { publishedCategories };
