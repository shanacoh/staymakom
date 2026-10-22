// Email au prestataire pour une réservation payée (ou son annulation), dans sa langue.
//
// Ce que l'email contient : expérience, date, créneau, participants, prénom et initiale du client,
// langue du client, demandes particulières, lien vers l'espace. Jamais le prix payé par le client,
// ni son email, ni son téléphone.
//
// Ce module ne fait que LIRE la réservation (statut de paiement compris) et poser sa propre date
// d'envoi, qui empêche les doublons. Il ne modifie ni le paiement ni la confirmation.
// Un prestataire qui n'a pas encore été invité dans l'espace partenaire ne reçoit rien.

import { formatBookingDate } from "../practical-info/content.ts";
import { PARTNER_SPACE_URL, partnerLang, renderPartnerEmail, sendPartnerEmail, type PartnerLang } from "./email.ts";
import { formatTimeSlot } from "../time-slot.ts";

// deno-lint-ignore no-explicit-any
type ServiceClient = any;

export type BookingNoticeKind = "paid" | "cancelled";

export interface BookingNoticeData {
  experienceTitle: string;
  bookingDate: string;
  timeSlot?: string | null;
  adults: number;
  children: number;
  customerName: string;
  customerLang?: string | null;
  specialRequests?: string | null;
  bookingRef: string;
}

const LANGUAGE_NAMES: Record<string, Record<PartnerLang, string>> = {
  he: { en: "Hebrew", fr: "Hébreu", he: "עברית" },
  en: { en: "English", fr: "Anglais", he: "אנגלית" },
  fr: { en: "French", fr: "Français", he: "צרפתית" },
};

const TEXTS: Record<PartnerLang, {
  eyebrow: string;
  paidSubject: (title: string, date: string) => string;
  paidBanner: string;
  paidSub: string;
  paidIntro: string;
  cancelledSubject: (title: string, date: string) => string;
  cancelledBanner: string;
  cancelledSub: string;
  cancelledIntro: string;
  experience: string;
  reference: string;
  date: string;
  time: string;
  participants: string;
  people: (adults: number, children: number) => string;
  customer: string;
  language: string;
  requests: string;
  cta: string;
  contact: string;
}> = {
  en: {
    eyebrow: "Partner space",
    paidSubject: (title, date) => `New booking: ${title}, ${date}`,
    paidBanner: "New confirmed booking",
    paidSub: "Paid by the customer",
    paidIntro: "A new booking has just been confirmed for one of your experiences. Here are the details:",
    cancelledSubject: (title, date) => `Booking cancelled: ${title}, ${date}`,
    cancelledBanner: "Booking cancelled",
    cancelledSub: "This booking will not take place",
    cancelledIntro: "The booking below has been cancelled. You no longer need to expect these guests.",
    experience: "Experience",
    reference: "Reference",
    date: "Date",
    time: "Time",
    participants: "Participants",
    people: (adults, children) =>
      `${adults} adult${adults > 1 ? "s" : ""}${children > 0 ? `, ${children} child${children > 1 ? "ren" : ""}` : ""}`,
    customer: "Customer",
    language: "Customer language",
    requests: "Special requests",
    cta: "See in my space",
    contact: "A question about this booking? Simply reply to this email. The STAYMAKOM team",
  },
  fr: {
    eyebrow: "Espace partenaire",
    paidSubject: (title, date) => `Nouvelle réservation : ${title}, ${date}`,
    paidBanner: "Nouvelle réservation confirmée",
    paidSub: "Payée par le client",
    paidIntro: "Une nouvelle réservation vient d'être confirmée pour une de vos expériences. Voici le détail :",
    cancelledSubject: (title, date) => `Réservation annulée : ${title}, ${date}`,
    cancelledBanner: "Réservation annulée",
    cancelledSub: "Cette réservation n'aura pas lieu",
    cancelledIntro: "La réservation ci-dessous a été annulée. Vous n'avez plus à attendre ces participants.",
    experience: "Expérience",
    reference: "Référence",
    date: "Date",
    time: "Créneau",
    participants: "Participants",
    people: (adults, children) =>
      `${adults} adulte${adults > 1 ? "s" : ""}${children > 0 ? `, ${children} enfant${children > 1 ? "s" : ""}` : ""}`,
    customer: "Client",
    language: "Langue du client",
    requests: "Demandes particulières",
    cta: "Voir dans mon espace",
    contact: "Une question sur cette réservation ? Répondez simplement à cet email. L'équipe STAYMAKOM",
  },
  he: {
    eyebrow: "אזור השותפים",
    paidSubject: (title, date) => `הזמנה חדשה: ${title}, ${date}`,
    paidBanner: "הזמנה חדשה אושרה",
    paidSub: "שולמה על ידי הלקוח",
    paidIntro: "הזמנה חדשה אושרה לאחת החוויות שלכם. אלה הפרטים:",
    cancelledSubject: (title, date) => `הזמנה בוטלה: ${title}, ${date}`,
    cancelledBanner: "ההזמנה בוטלה",
    cancelledSub: "ההזמנה הזו לא תתקיים",
    cancelledIntro: "ההזמנה שלהלן בוטלה. אין צורך לחכות למשתתפים האלה.",
    experience: "חוויה",
    reference: "מספר הזמנה",
    date: "תאריך",
    time: "שעה",
    participants: "משתתפים",
    people: (adults, children) => `${adults} מבוגרים${children > 0 ? `, ${children} ילדים` : ""}`,
    customer: "לקוח",
    language: "שפת הלקוח",
    requests: "בקשות מיוחדות",
    cta: "לצפייה באזור שלי",
    contact: "יש שאלה על ההזמנה? אפשר פשוט להשיב למייל הזה. צוות STAYMAKOM",
  },
};

/** « Dana Levi Cohen » devient « Dana C. » : le prestataire ne reçoit jamais le nom complet. */
export function customerShortName(fullName: string | null | undefined): string {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

export function buildBookingNotice(kind: BookingNoticeKind, lang: PartnerLang, data: BookingNoticeData): { subject: string; html: string } {
  const t = TEXTS[lang];
  const dateLabel = formatBookingDate(data.bookingDate, lang);
  const paid = kind === "paid";
  const html = renderPartnerEmail({
    lang,
    eyebrow: t.eyebrow,
    banner: paid ? t.paidBanner : t.cancelledBanner,
    bannerSub: paid ? t.paidSub : t.cancelledSub,
    intro: paid ? t.paidIntro : t.cancelledIntro,
    rows: [
      { label: t.experience, value: data.experienceTitle },
      { label: t.reference, value: data.bookingRef },
      { label: t.date, value: dateLabel },
      { label: t.time, value: data.timeSlot ?? "" },
      { label: t.participants, value: t.people(data.adults, data.children) },
      { label: t.customer, value: customerShortName(data.customerName) },
      { label: t.language, value: paid ? (LANGUAGE_NAMES[data.customerLang ?? ""]?.[lang] ?? "") : "" },
      { label: t.requests, value: paid ? (data.specialRequests ?? "") : "" },
    ],
    cta: { label: t.cta, url: `${PARTNER_SPACE_URL}/bookings` },
    contact: t.contact,
  });
  return { subject: (paid ? t.paidSubject : t.cancelledSubject)(data.experienceTitle, dateLabel), html };
}

const PAID_STATUSES = ["paid", "deposit_paid"];

/**
 * Prévient le prestataire d'une réservation. Renvoie ce qui s'est passé, sans jamais lever
 * d'erreur bloquante pour l'appelant : la confirmation au client ne dépend pas de cet envoi.
 */
export async function notifyProviderOfBooking(
  serviceClient: ServiceClient,
  bookingId: string,
  kind: BookingNoticeKind,
): Promise<{ sent: boolean; reason?: string }> {
  const { data: booking, error } = await serviceClient
    .from("standalone_bookings")
    .select("id, standalone_experience_id, provider_id, booking_date, time_slot, party_size, adults_count, children_count, customer_name, preferred_lang, special_requests, status, is_cancelled, payment_status, custom_experience_title, provider_notified_at, provider_cancel_notified_at, standalone_experiences(title, title_fr, title_he)")
    .eq("id", bookingId)
    .maybeSingle();
  if (error) throw error;
  if (!booking) return { sent: false, reason: "booking_not_found" };

  const cancelled = booking.status === "cancelled" || booking.is_cancelled === true;
  if (kind === "paid") {
    // On lit le statut de paiement tel qu'il est : payée (en entier ou par acompte) et non annulée.
    if (!PAID_STATUSES.includes(booking.payment_status ?? "") || cancelled) return { sent: false, reason: "not_paid" };
    if (booking.provider_notified_at) return { sent: false, reason: "already_sent" };
  } else {
    if (!cancelled) return { sent: false, reason: "not_cancelled" };
    // On n'annonce une annulation qu'à un prestataire qui avait été prévenu de la réservation.
    if (!booking.provider_notified_at) return { sent: false, reason: "never_notified" };
    if (booking.provider_cancel_notified_at) return { sent: false, reason: "already_sent" };
  }

  // Le prestataire : celui noté sur la réservation, sinon le prestataire principal de l'expérience.
  let providerId: string | null = booking.provider_id ?? null;
  if (!providerId && booking.standalone_experience_id) {
    const { data: internal } = await serviceClient
      .from("standalone_experience_internal")
      .select("provider_id")
      .eq("experience_id", booking.standalone_experience_id)
      .maybeSingle();
    providerId = internal?.provider_id ?? null;
  }
  if (!providerId) return { sent: false, reason: "no_provider" };

  const [{ data: provider }, { data: users }] = await Promise.all([
    serviceClient.from("providers").select("name, email, language, status").eq("id", providerId).maybeSingle(),
    serviceClient.from("provider_users").select("email").eq("provider_id", providerId),
  ]);
  if (!provider || provider.status === "arrete") return { sent: false, reason: "provider_inactive" };
  if (!users || users.length === 0) return { sent: false, reason: "provider_not_invited" };

  const recipients = [...new Set(
    [provider.email, ...users.map((u: { email: string }) => u.email)]
      .map((email) => (email ?? "").trim().toLowerCase())
      .filter((email) => email.includes("@")),
  )];
  if (recipients.length === 0) return { sent: false, reason: "no_email" };

  // Pas d'envoi en double : on « prend » d'abord la réservation (date posée seulement si vide).
  const marker = kind === "paid" ? "provider_notified_at" : "provider_cancel_notified_at";
  const { data: claimed, error: claimError } = await serviceClient
    .from("standalone_bookings")
    .update({ [marker]: new Date().toISOString() })
    .eq("id", booking.id)
    .is(marker, null)
    .select("id");
  if (claimError) throw claimError;
  if (!claimed || claimed.length === 0) return { sent: false, reason: "already_sent" };

  const lang = partnerLang(provider.language);
  const experience = booking.standalone_experiences as Record<string, string | null> | null;
  const title = (lang === "en" ? experience?.title : experience?.[`title_${lang}`]) || experience?.title
    || booking.custom_experience_title || "";
  const { subject, html } = buildBookingNotice(kind, lang, {
    experienceTitle: title,
    bookingDate: booking.booking_date,
    timeSlot: formatTimeSlot(booking.time_slot, lang),
    adults: booking.adults_count ?? booking.party_size ?? 0,
    children: booking.children_count ?? 0,
    customerName: booking.customer_name,
    customerLang: booking.preferred_lang,
    specialRequests: booking.special_requests,
    bookingRef: `SM-${String(booking.id).slice(0, 8).toUpperCase()}`,
  });

  const sent = await sendPartnerEmail(recipients, subject, html);
  if (!sent.ok) {
    // L'email n'est pas parti : on libère la réservation pour qu'un nouvel essai soit possible.
    await serviceClient.from("standalone_bookings").update({ [marker]: null }).eq("id", booking.id);
    return { sent: false, reason: "send_failed" };
  }
  return { sent: true };
}
