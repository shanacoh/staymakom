/**
 * Page catalogue "Bateaux". Deux colonnes sur desktop : à gauche, un filtre
 * "façon phrase" (personnes, port, durée, date, moment de la journée) fixe
 * au scroll ; à droite, la grille de résultats qui se met à jour en direct.
 * Un clic sur une carte ouvre la fiche détail (photos, inclus, RDV) ; le
 * bouton vert va droit sur WhatsApp avec la sortie déjà décrite dedans —
 * pas de formulaire à remplir pour ce chemin rapide.
 * Sur mobile, le filtre passe au-dessus des résultats, sans effet "fixe".
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { trackListingViewed } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import V3Header from "@/components/V3Header";
import LaunchFooter from "@/components/LaunchFooter";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/hooks/useLanguage";
import { BOATS_CATEGORY_ID } from "@/lib/boatsCategory";
import BoatDetailModal from "@/components/boats/BoatDetailModal";
import BoatSentenceFilter, { type BoatFilterState } from "@/components/boats/BoatSentenceFilter";
import { WHATSAPP_NUMBER } from "@/constants/whatsapp";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale";

type PriceVariant = {
  id: string;
  duration_minutes: number | null;
  max_capacity: number;
  sale_price: number;
  currency: string;
};

type BoatRow = {
  id: string;
  slug: string;
  title: string;
  title_he: string | null;
  title_fr: string | null;
  subtitle: string | null;
  subtitle_fr: string | null;
  subtitle_he: string | null;
  hero_image: string | null;
  city: string | null;
  is_featured: boolean;
  standalone_experience_price_variants: PriceVariant[];
};

const DURATION_BUCKET_MINUTES: Record<string, number> = { "2h": 120, "3h": 180, "4h": 240 };

function durationLabel(minutes: number | null): string {
  if (!minutes) return "";
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  return `${Math.floor(minutes / 60)}h${minutes % 60}`;
}

const DEFAULT_FILTER: BoatFilterState = {
  persons: 2,
  city: "any",
  duration: "2h",
  dateBucket: null,
  specificDate: null,
  timeOfDay: null,
};

const Boats = () => {
  const { lang } = useLanguage();
  const isRTL = lang === "he";
  const [selectedBoatId, setSelectedBoatId] = useState<string | null>(null);
  // Lecture une seule fois au chargement, pour pouvoir envoyer un lien /boat?city=...
  // déjà pré-rempli (ex: WhatsApp "pas dispo, voici les autres bateaux à Herzliya").
  // Volontairement pas resynchronisé vers l'URL ensuite : c'est un point d'entrée,
  // pas un système de filtres partagé entre plusieurs écrans (cf. le pop-up unique).
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<BoatFilterState>(() => {
    const cityParam = searchParams.get("city");
    const isValidCity = cityParam === "Tel Aviv" || cityParam === "Herzliya";
    return isValidCity ? { ...DEFAULT_FILTER, city: cityParam } : DEFAULT_FILTER;
  });

  const pageTitle = isRTL ? "יוצאים לים" : lang === "fr" ? "Prendre le large" : "On the water";
  const pageDescription = isRTL
    ? "גלו את מבחר הסירות הנבחר שלנו ברחבי ישראל."
    : lang === "fr"
      ? "Découvrez notre sélection de bateaux soigneusement choisis à travers Israël."
      : "Explore Israel from the sea with our handpicked collection of boats.";

  useEffect(() => {
    trackListingViewed("boats");
  }, []);

  const { data: boats, isLoading } = useQuery({
    queryKey: ["boats-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_experiences")
        .select(`
          id, slug, title, title_he, title_fr,
          subtitle, subtitle_fr, subtitle_he,
          hero_image, city, is_featured,
          standalone_experience_price_variants(id, duration_minutes, max_capacity, sale_price, currency)
        `)
        .eq("category_id", BOATS_CATEGORY_ID)
        .eq("status", "published")
        .order("display_order", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []) as unknown as BoatRow[];
    },
  });

  const localized = (base?: string | null, fr?: string | null, he?: string | null) =>
    lang === "he" ? he || base : lang === "fr" ? fr || base : base;

  const results = useMemo(() => {
    return (boats ?? [])
      .filter((boat) => filter.city === "any" || boat.city === filter.city)
      .map((boat) => {
        const variants = boat.standalone_experience_price_variants || [];
        const bucketMinutes = DURATION_BUCKET_MINUTES[filter.duration];
        const matching = bucketMinutes
          ? variants.filter((v) => v.duration_minutes === bucketMinutes)
          : variants.filter((v) => v.duration_minutes !== 120 && v.duration_minutes !== 180 && v.duration_minutes !== 240);
        const fitting = matching.filter((v) => v.max_capacity >= filter.persons);
        if (fitting.length === 0) return null;
        const cheapest = fitting.reduce((a, b) => (a.sale_price <= b.sale_price ? a : b));
        const allDurations = Array.from(new Set(variants.map((v) => v.duration_minutes).filter(Boolean)))
          .sort((a, b) => (a as number) - (b as number))
          .map((m) => durationLabel(m as number));
        return { boat, variant: cheapest, allDurations };
      })
      .filter((r): r is { boat: BoatRow; variant: PriceVariant; allDurations: string[] } => r !== null)
      .sort((a, b) => a.variant.sale_price - b.variant.sale_price);
  }, [boats, filter]);

  const t = {
    resultsCount: (n: number) =>
      isRTL ? `${n} סירות זמינות` : lang === "fr" ? `${n} bateau${n > 1 ? "x" : ""} disponible${n > 1 ? "s" : ""}` : `${n} boat${n > 1 ? "s" : ""} available`,
    resultsHint: isRTL ? "תארו את הטיול משמאל, הבחירה מתעדכנת" : lang === "fr" ? "Décris ta sortie à gauche, la sélection s'ajuste" : "Describe your outing on the left, the selection updates",
    upTo: isRTL ? "עד" : lang === "fr" ? "jusqu'à" : "up to",
    people: isRTL ? "אנשים" : lang === "fr" ? "pers." : "people",
    ourPick: isRTL ? "הבחירה שלנו" : lang === "fr" ? "Notre choix" : "Our pick",
    from: isRTL ? "החל מ" : lang === "fr" ? "dès" : "from",
    whatsappCta: isRTL ? "בקשה בוואטסאפ" : lang === "fr" ? "Demander sur WhatsApp" : "Ask on WhatsApp",
    empty: isRTL ? "אין סירה בקריטריונים האלה כרגע, נסו לשנות." : lang === "fr" ? "Aucun bateau ne correspond à ces critères pour l'instant, essayez d'ajuster." : "No boat matches these criteria yet, try adjusting them.",
  };

  const dateBucketLabel = (bucket: BoatFilterState["dateBucket"], specificDate?: string | null) => {
    if (bucket === "today_tomorrow") return lang === "fr" ? "aujourd'hui ou demain" : "today or tomorrow";
    if (bucket === "this_week") return lang === "fr" ? "dans la semaine" : "this week";
    if (bucket === "later") {
      if (specificDate) return format(new Date(specificDate + "T12:00:00"), "d MMM yyyy", { locale: lang === "fr" ? frLocale : undefined });
      return lang === "fr" ? "plus tard" : "later";
    }
    return null;
  };
  const timeOfDayLabel = (t2: BoatFilterState["timeOfDay"]) => {
    if (t2 === "daytime") return lang === "fr" ? "en journée" : "during the day";
    if (t2 === "sunset") return lang === "fr" ? "au sunset" : "at sunset";
    return null;
  };

  const buildWhatsappHref = (boat: BoatRow, variant: PriceVariant) => {
    const title = localized(boat.title, boat.title_fr, boat.title_he);
    const parts = [
      lang === "fr" ? `Bonjour, je suis intéressé(e) par : ${title}` : `Hi, I'm interested in: ${title}`,
      `${filter.persons} ${lang === "fr" ? "personnes" : "people"}`,
      durationLabel(variant.duration_minutes),
    ];
    const dateLabel = dateBucketLabel(filter.dateBucket, filter.specificDate);
    if (dateLabel) parts.push(dateLabel);
    const timeLabel = timeOfDayLabel(filter.timeOfDay);
    if (timeLabel) parts.push(timeLabel);
    const message = parts.join(" · ");
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  // Trace silencieuse : le clic ouvre WhatsApp tout de suite (rien ne bloque
  // le visiteur), mais on garde une ligne dans le suivi des demandes pour que
  // ça remonte côté back-office — sans nom/contact, puisqu'on ne les demande
  // pas ici (source: "card_whatsapp" les distingue des demandes via le pop-up).
  // Best-effort total : une erreur ici ne doit jamais empêcher l'ouverture de WhatsApp.
  const logDirectWhatsappClick = async (boat: BoatRow, variant: PriceVariant) => {
    try {
      const requestId = crypto.randomUUID();
      // Date précise (bucket "plus tard" + calendrier choisi) → requested_date, un
      // vrai champ structuré. Sinon ("aujourd'hui ou demain" / "dans la semaine"),
      // pas de date exacte à stocker : on garde juste la fourchette, en anglais et
      // sans préfixe, pour qu'elle s'intègre proprement dans le message prestataire
      // (qui est toujours en anglais) au lieu d'y apparaître comme une note à part.
      const hasExactDate = filter.dateBucket === "later" && !!filter.specificDate;
      const dateRangeNote = !hasExactDate
        ? filter.dateBucket === "today_tomorrow" ? "today or tomorrow"
        : filter.dateBucket === "this_week" ? "this week"
        : null
        : null;
      const { error } = await (supabase as any).from("standalone_experience_requests").insert({
        id: requestId,
        experience_id: boat.id,
        source: "card_whatsapp",
        adults: filter.persons,
        children: 0,
        party_max: filter.persons,
        requested_date: hasExactDate ? filter.specificDate : null,
        requested_duration_minutes: variant.duration_minutes,
        price_variant_id: variant.id,
        desired_time_period: filter.timeOfDay === "sunset" ? "sunset" : null,
        is_urgent: filter.dateBucket === "today_tomorrow",
        language: lang,
        status: "new",
        message: dateRangeNote,
      });
      if (error) return;
      (supabase as any).functions.invoke("notify-standalone-experience-request", { body: { request_id: requestId } }).catch(() => {});
    } catch {
      // silencieux : ce n'est qu'une trace de suivi, jamais bloquant.
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" dir={isRTL ? "rtl" : "ltr"}>
      <SEOHead title={`${pageTitle} — STAYMAKOM`} description={pageDescription} />

      <V3Header />

      <main className="flex-1 pt-[56px]">
        <div className="lg:grid lg:grid-cols-[minmax(320px,400px)_1fr]">
          <aside className="border-b lg:border-b-0 lg:border-r border-border/60 lg:sticky lg:top-[56px] lg:h-[calc(100vh-56px)]">
            <BoatSentenceFilter value={filter} onChange={setFilter} />
          </aside>

          <section className="px-4 sm:px-6 py-6">
            <div className="mb-5">
              <h2 className="font-sans text-sm sm:text-base font-bold uppercase tracking-[0.03em] text-foreground">{isLoading ? "…" : t.resultsCount(results.length)}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t.resultsHint}</p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border overflow-hidden">
                    <div className="aspect-[4/3] bg-muted animate-pulse" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <p className="text-muted-foreground text-sm py-12 text-center">{t.empty}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map(({ boat, variant, allDurations }) => {
                  const title = localized(boat.title, boat.title_fr, boat.title_he);
                  const highlight = localized(boat.subtitle, boat.subtitle_fr, boat.subtitle_he);
                  return (
                    <div key={boat.id} className="rounded-xl border overflow-hidden bg-card flex flex-col">
                      <button type="button" onClick={() => setSelectedBoatId(boat.id)} className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
                        {boat.hero_image ? (
                          <img src={boat.hero_image} alt={title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
                        )}
                        <div className="absolute top-2 left-2 flex gap-1.5">
                          {boat.is_featured && (
                            <span className="rounded-full bg-[#ad1414] text-white text-[10px] font-semibold px-2 py-1">{t.ourPick}</span>
                          )}
                          <span className="rounded-full bg-white/90 text-foreground text-[10px] font-semibold px-2 py-1">
                            {t.upTo} {variant.max_capacity} {t.people}
                          </span>
                        </div>
                      </button>
                      <div className="p-3.5 flex flex-col gap-1.5 flex-1">
                        <div>
                          <button type="button" onClick={() => setSelectedBoatId(boat.id)} className="text-left">
                            <p className="font-semibold text-sm text-foreground">{title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {[boat.city, allDurations.join(", ")].filter(Boolean).join(" · ")}
                            </p>
                          </button>
                          {/* Toujours rendue (même vide) : garde la même hauteur de carte à carte,
                              que le bateau ait une description courte ou pas (ex: Speedboat for games). */}
                          <p className="text-xs text-muted-foreground line-clamp-1 min-h-[1rem] mt-0.5">{highlight || " "}</p>
                        </div>
                        {/* mt-auto : prix et bouton toujours au bas de la carte, alignés entre
                            cartes voisines même quand le bloc du dessus fait une hauteur différente. */}
                        <div className="mt-auto space-y-1.5">
                          <p className="text-base font-bold text-foreground">
                            {t.from} {Math.round(variant.sale_price).toLocaleString("fr-FR")} ₪
                          </p>
                          <a
                            href={buildWhatsappHref(boat, variant)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => logDirectWhatsappClick(boat, variant)}
                            className="flex items-center justify-center rounded-full bg-[#25D366] hover:bg-[#1ebe57] text-white text-sm font-semibold py-2 transition-colors"
                          >
                            {t.whatsappCta}
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <div className="hidden md:block">
        <LaunchFooter />
      </div>

      <BoatDetailModal boatId={selectedBoatId} onClose={() => setSelectedBoatId(null)} />
    </div>
  );
};

export default Boats;
