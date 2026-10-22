// Infos pratiques « après la réservation » : le seul endroit qui décide ce que le client reçoit
// (point de rendez-vous, accès, arriver X minutes avant, à savoir, météo) et comment c'est écrit,
// en email comme en message WhatsApp.
// Le contact du jour J (de l'expérience ou du prestataire) n'y figure jamais : il est interne à
// l'équipe, le client passe toujours par Staymakom.
//
// Fichier sans aucune dépendance : il est lu par les fonctions serveur (email de confirmation,
// rappel de la veille) et par le back-office (message WhatsApp prêt à envoyer).
// Règle : un champ vide n'apparaît jamais. Si tout est vide, il n'y a pas de bloc du tout.

export type PracticalLang = "en" | "fr" | "he";

export const STAYMAKOM_WHATSAPP_URL = "https://wa.me/972555009910";

/** Champs de la fiche expérience (table publique) utiles aux infos pratiques. */
export interface PracticalInfoSource {
  meeting_point?: string | null;
  meeting_point_fr?: string | null;
  meeting_point_he?: string | null;
  address?: string | null;
  address_fr?: string | null;
  address_he?: string | null;
  access_note?: string | null;
  access_note_fr?: string | null;
  access_note_he?: string | null;
  arrive_minutes_before?: number | null;
  know_before_you_go?: string | null;
  know_before_you_go_fr?: string | null;
  know_before_you_go_he?: string | null;
  contingency_note?: string | null;
  contingency_note_fr?: string | null;
  contingency_note_he?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  google_maps_link?: string | null;
}

/** Colonnes à lire sur `standalone_experiences` pour construire les infos pratiques. */
export const PRACTICAL_INFO_COLUMNS =
  "meeting_point, meeting_point_fr, meeting_point_he, address, address_fr, address_he, " +
  "access_note, access_note_fr, access_note_he, arrive_minutes_before, " +
  "know_before_you_go, know_before_you_go_fr, know_before_you_go_he, " +
  "contingency_note, contingency_note_fr, contingency_note_he, latitude, longitude, google_maps_link";

export interface PracticalInfo {
  lang: PracticalLang;
  meetingPoint?: string;
  /** Adresse complète : toujours donnée une fois réservé, même si elle est masquée sur la fiche. */
  address?: string;
  wazeUrl?: string;
  mapsUrl?: string;
  access?: string;
  arriveMinutes?: number;
  knowBefore?: string;
  contingency?: string;
}

export function normalizeLang(value: unknown): PracticalLang {
  return value === "fr" || value === "he" ? value : "en";
}

const clean = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

// Texte dans la langue du client ; à défaut la version anglaise, puis n'importe quelle version remplie.
function localized(source: Record<string, unknown>, base: string, lang: PracticalLang): string {
  const own = clean(source[lang === "en" ? base : `${base}_${lang}`]);
  return own || clean(source[base]) || clean(source[`${base}_fr`]) || clean(source[`${base}_he`]);
}

const LABELS: Record<PracticalLang, {
  title: string;
  meetingPoint: string;
  address: string;
  access: string;
  arrival: string;
  arrive: (minutes: number) => string;
  knowBefore: string;
  contingency: string;
  waze: string;
  maps: string;
  question: string;
  questionLink: string;
}> = {
  en: {
    title: "Practical info",
    meetingPoint: "Meeting point",
    address: "Address",
    access: "Getting there",
    arrival: "Arrival",
    arrive: (m) => `Please arrive ${m} minutes early.`,
    knowBefore: "Good to know",
    contingency: "Weather or changes",
    waze: "Open in Waze",
    maps: "Open in Google Maps",
    question: "A question? Our team answers on WhatsApp",
    questionLink: "Write to us",
  },
  fr: {
    title: "Infos pratiques",
    meetingPoint: "Point de rendez-vous",
    address: "Adresse",
    access: "Comment y aller",
    arrival: "Arrivée",
    arrive: (m) => `Merci d'arriver ${m} minutes avant.`,
    knowBefore: "À savoir",
    contingency: "Météo ou imprévu",
    waze: "Ouvrir dans Waze",
    maps: "Ouvrir dans Google Maps",
    question: "Une question ? Notre équipe vous répond sur WhatsApp",
    questionLink: "Nous écrire",
  },
  he: {
    title: "מידע שימושי",
    meetingPoint: "נקודת מפגש",
    address: "כתובת",
    access: "איך מגיעים",
    arrival: "הגעה",
    arrive: (m) => `נא להגיע ${m} דקות לפני.`,
    knowBefore: "חשוב לדעת",
    contingency: "מזג אוויר או שינויים",
    waze: "פתיחה ב-Waze",
    maps: "פתיחה ב-Google Maps",
    question: "יש שאלה? הצוות שלנו עונה בוואטסאפ",
    questionLink: "לכתוב לנו",
  },
};

function navigationLinks(source: PracticalInfoSource, address: string): { wazeUrl?: string; mapsUrl?: string } {
  const lat = Number(source.latitude);
  const lng = Number(source.longitude);
  const hasCoords = source.latitude != null && source.longitude != null && Number.isFinite(lat) && Number.isFinite(lng);
  const customMaps = clean(source.google_maps_link);
  if (hasCoords) {
    return {
      wazeUrl: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
      mapsUrl: customMaps || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    };
  }
  if (address) {
    const query = encodeURIComponent(address);
    return {
      wazeUrl: `https://waze.com/ul?q=${query}&navigate=yes`,
      mapsUrl: customMaps || `https://www.google.com/maps/search/?api=1&query=${query}`,
    };
  }
  return customMaps ? { mapsUrl: customMaps } : {};
}

/**
 * Construit les infos pratiques d'une fiche dans la langue du client.
 * Renvoie `null` si la fiche n'a aucune info pratique : le message reste alors celui d'avant.
 * (L'adresse seule ne suffit pas à créer le bloc : elle figurait déjà dans la confirmation.)
 */
export function buildPracticalInfo(
  source: PracticalInfoSource | null | undefined,
  langInput: unknown,
): PracticalInfo | null {
  if (!source) return null;
  const lang = normalizeLang(langInput);
  const fields = source as Record<string, unknown>;

  const meetingPoint = localized(fields, "meeting_point", lang);
  const access = localized(fields, "access_note", lang);
  const knowBefore = localized(fields, "know_before_you_go", lang);
  const contingency = localized(fields, "contingency_note", lang);
  const minutes = Number(source.arrive_minutes_before);
  const arriveMinutes = source.arrive_minutes_before != null && Number.isFinite(minutes) && minutes > 0 ? minutes : undefined;

  if (!meetingPoint && !access && !knowBefore && !contingency && !arriveMinutes) return null;

  const address = localized(fields, "address", lang);
  const info: PracticalInfo = { lang, ...navigationLinks(source, address) };
  if (meetingPoint) info.meetingPoint = meetingPoint;
  if (address && address !== meetingPoint) info.address = address;
  if (access) info.access = access;
  if (arriveMinutes) info.arriveMinutes = arriveMinutes;
  if (knowBefore) info.knowBefore = knowBefore;
  if (contingency) info.contingency = contingency;
  return info;
}

/** Vrai si le bloc indique déjà où aller (point de rendez-vous ou adresse). */
export function hasLocation(info: PracticalInfo | null): boolean {
  return !!(info?.meetingPoint || info?.address);
}

const escapeHTML = (str: string): string =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Bloc « Infos pratiques » pour un email, dans l'habillage des emails Staymakom. Chaîne vide si rien à dire. */
export function renderPracticalInfoHtml(info: PracticalInfo | null): string {
  if (!info) return "";
  const t = LABELS[info.lang];
  const rtl = info.lang === "he";
  const align = rtl ? "right" : "left";
  const brandRed = "#ad1414";
  const labelStyle = `margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#999;text-align:${align};`;
  const valueStyle = `margin:4px 0 0;font-size:14px;color:#1a1a1a;line-height:1.6;white-space:pre-line;text-align:${align};`;
  const linkStyle = `color:${brandRed};text-decoration:none;font-weight:600;`;

  const rows: string[] = [];
  const row = (label: string, body: string) =>
    rows.push(`<tr><td style="padding:0 0 16px;"><p style="${labelStyle}">${label}</p>${body}</td></tr>`);
  const text = (value: string) => `<p style="${valueStyle}">${escapeHTML(value)}</p>`;

  if (info.meetingPoint || info.address) {
    const links = [
      info.wazeUrl ? `<a href="${escapeHTML(info.wazeUrl)}" style="${linkStyle}">${t.waze}</a>` : "",
      info.mapsUrl ? `<a href="${escapeHTML(info.mapsUrl)}" style="${linkStyle}">${t.maps}</a>` : "",
    ].filter(Boolean).join(" &nbsp;·&nbsp; ");
    const body =
      text(info.meetingPoint || info.address || "") +
      (info.meetingPoint && info.address ? `<p style="${valueStyle}color:#555;">${escapeHTML(info.address)}</p>` : "") +
      (links ? `<p style="margin:8px 0 0;font-size:13px;text-align:${align};">${links}</p>` : "");
    row(info.meetingPoint ? t.meetingPoint : t.address, body);
  }
  if (info.access) row(t.access, text(info.access));
  if (info.arriveMinutes) row(t.arrival, text(t.arrive(info.arriveMinutes)));
  if (info.knowBefore) row(t.knowBefore, text(info.knowBefore));
  if (info.contingency) row(t.contingency, text(info.contingency));

  return `
              <!-- Infos pratiques -->
              <table width="100%" cellpadding="0" cellspacing="0" dir="${rtl ? "rtl" : "ltr"}" style="background:#FAF9F6;border-radius:8px;border:1px solid #eee;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px 24px 8px;">
                    <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#1a1a1a;text-align:${align};">${t.title}</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${rows.join("\n                      ")}
                      <tr><td style="padding:16px 0;border-top:1px solid #eee;">
                        <p style="margin:0;font-size:13px;color:#555;text-align:${align};">${t.question} &nbsp;·&nbsp; <a href="${STAYMAKOM_WHATSAPP_URL}" style="${linkStyle}">${t.questionLink}</a></p>
                      </td></tr>
                    </table>
                  </td>
                </tr>
              </table>`;
}

/** Les mêmes infos en lignes de texte court (WhatsApp). Tableau vide si rien à dire. */
export function renderPracticalInfoLines(info: PracticalInfo | null): string[] {
  if (!info) return [];
  const t = LABELS[info.lang];
  const lines: string[] = [];
  if (info.meetingPoint) lines.push(`📍 ${t.meetingPoint} : ${info.meetingPoint}`);
  if (info.address) lines.push(`${info.meetingPoint ? "🏠" : "📍"} ${t.address} : ${info.address}`);
  if ((info.meetingPoint || info.address) && info.wazeUrl) lines.push(`Waze : ${info.wazeUrl}`);
  if ((info.meetingPoint || info.address) && info.mapsUrl) lines.push(`Google Maps : ${info.mapsUrl}`);
  if (info.access) lines.push(`🚗 ${t.access} : ${info.access}`);
  if (info.arriveMinutes) lines.push(`⏰ ${t.arrive(info.arriveMinutes)}`);
  if (info.knowBefore) lines.push(`ℹ️ ${t.knowBefore} : ${info.knowBefore}`);
  if (info.contingency) lines.push(`🌦 ${t.contingency} : ${info.contingency}`);
  return lines;
}

const DATE_LOCALES: Record<PracticalLang, string> = { en: "en-US", fr: "fr-FR", he: "he-IL" };

/** Date de la prestation (yyyy-MM-dd) écrite en toutes lettres dans la langue du client. */
export function formatBookingDate(dateStr: string, lang: PracticalLang): string {
  const date = new Date(`${dateStr.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(DATE_LOCALES[lang], { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

// Créneau « moment de la journée » (codes neutres, mêmes valeurs que _shared/time-slot.ts).
const SLOT_MOMENTS: Record<string, Record<PracticalLang, string>> = {
  morning: { en: "in the morning", fr: "le matin", he: "בבוקר" },
  afternoon: { en: "in the afternoon", fr: "l'après-midi", he: "אחר הצהריים" },
};

/** « at 10:00 » pour une heure, « in the morning » pour un moment de la journée. */
function slotPhrase(slot: string | null | undefined, lang: PracticalLang): string {
  const value = clean(slot);
  if (!value) return "";
  if (SLOT_MOMENTS[value]) return ` ${SLOT_MOMENTS[value][lang]}`;
  const at: Record<PracticalLang, string> = { en: "at", fr: "à", he: "בשעה" };
  return ` ${at[lang]} ${value}`;
}

export interface ClientMessageBooking {
  customerName: string;
  experienceTitle: string;
  bookingDate: string;
  timeSlot?: string | null;
}

/**
 * Message WhatsApp prêt à envoyer au client : même contenu que le bloc de l'email, en texte court.
 * On parle au nom de l'équipe, jamais avec un prénom.
 */
export function buildClientWhatsAppMessage(booking: ClientMessageBooking, info: PracticalInfo | null, langInput: unknown): string {
  const lang = normalizeLang(langInput);
  const date = formatBookingDate(booking.bookingDate, lang);
  const time = slotPhrase(booking.timeSlot, lang);
  const name = clean(booking.customerName);
  const title = clean(booking.experienceTitle);
  const lines = renderPracticalInfoLines(info);

  const intro: Record<PracticalLang, string> = {
    en: `Hi ${name}, here is the practical info for "${title}", ${date}${time}.`,
    fr: `Bonjour ${name}, voici les infos pratiques pour « ${title} », ${date}${time}.`,
    he: `היי ${name}, הנה המידע השימושי עבור "${title}", ${date}${time}.`,
  };
  const introWithoutInfo: Record<PracticalLang, string> = {
    en: `Hi ${name}, a quick reminder of your booking "${title}", ${date}${time}.`,
    fr: `Bonjour ${name}, un petit rappel de votre réservation « ${title} », ${date}${time}.`,
    he: `היי ${name}, תזכורת קטנה להזמנה "${title}", ${date}${time}.`,
  };
  const outro: Record<PracticalLang, string> = {
    en: "A question? Our team answers right here.\nThe Staymakom team",
    fr: "Une question ? Notre équipe vous répond ici.\nL'équipe Staymakom",
    he: "יש שאלה? הצוות שלנו עונה כאן.\nצוות Staymakom",
  };

  return [lines.length ? intro[lang] : introWithoutInfo[lang], ...lines, outro[lang]].join("\n");
}
