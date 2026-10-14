// partner-notify — les emails déclenchés par la base pour l'espace partenaire.
//
// Appelée uniquement par la base (elle présente le secret rangé dans son coffre), jamais par un
// navigateur. Quatre événements :
//  - proposal_created : un prestataire a envoyé une proposition → email à l'équipe ;
//  - terms_accepted   : un prestataire a accepté les conditions → email à l'équipe ;
//  - booking_paid     : une réservation vient de passer payée et le prestataire n'a pas encore été
//                       prévenu → email au prestataire (filet pour les paiements confirmés en retard ;
//                       d'habitude il part avec la confirmation du client) ;
//  - booking_cancelled : une réservation annoncée à un prestataire est annulée → email au prestataire.
//
// Les deux emails à l'équipe sont internes : ils reprennent quand même l'habillage commun.
// `preview` : envoie un exemple de chaque email prestataire à l'adresse d'un admin, sans rien lire ni écrire.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isAdminEmail, isInternalCron } from "../_shared/internal-auth.ts";
import { PARTNER_SITE_URL, partnerLang, renderPartnerEmail, sendPartnerEmail } from "../_shared/partner/email.ts";
import { buildBookingNotice, notifyProviderOfBooking } from "../_shared/partner/booking-notice.ts";

const TEAM_EMAIL = Deno.env.get("PARTNER_TEAM_EMAIL") || "shana@staymakom.com";

const PROPOSAL_TYPE_LABELS: Record<string, string> = {
  text: "Textes",
  photos: "Photos",
  price: "Prix fournisseur",
  practical_info: "Infos pratiques",
  new_experience: "Nouvelle expérience",
};

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });

// deno-lint-ignore no-explicit-any
async function notifyProposalCreated(supabase: any, id: string) {
  const { data: proposal } = await supabase
    .from("partner_proposals")
    .select("id, proposal_type, proposed, note, providers(name), standalone_experiences!partner_proposals_experience_id_fkey(title, title_fr)")
    .eq("id", id)
    .maybeSingle();
  if (!proposal) return { sent: false, reason: "not_found" };

  const experience = proposal.standalone_experiences as { title: string | null; title_fr: string | null } | null;
  const providerName = (proposal.providers as { name: string } | null)?.name ?? "Un prestataire";
  const typeLabel = PROPOSAL_TYPE_LABELS[proposal.proposal_type] ?? proposal.proposal_type;
  const subjectTitle = proposal.proposal_type === "new_experience"
    ? String(proposal.proposed?.title ?? "")
    : (experience?.title_fr || experience?.title || "");

  const html = renderPartnerEmail({
    lang: "fr",
    eyebrow: "Back-office",
    banner: "Nouvelle proposition partenaire",
    bannerSub: "À valider avant toute mise en ligne",
    intro: `${providerName} vient d'envoyer une proposition. Rien n'est modifié sur le site tant qu'elle n'est pas acceptée.`,
    rows: [
      { label: "Prestataire", value: providerName },
      { label: "Type", value: typeLabel },
      { label: proposal.proposal_type === "new_experience" ? "Titre proposé" : "Expérience", value: subjectTitle },
      { label: "Message du prestataire", value: proposal.note ?? "" },
    ],
    cta: { label: "Voir la proposition", url: `${PARTNER_SITE_URL}/admin/partenaires/propositions` },
    contact: "Email interne envoyé par l'espace partenaire.",
  });
  const sent = await sendPartnerEmail([TEAM_EMAIL], `Proposition partenaire : ${providerName} (${typeLabel})`, html);
  return { sent: sent.ok };
}

// deno-lint-ignore no-explicit-any
async function notifyTermsAccepted(supabase: any, id: string) {
  const { data: acceptance } = await supabase
    .from("partner_terms_acceptances")
    .select("id, provider_id, version, signer_name, accepted_at, providers(name)")
    .eq("id", id)
    .maybeSingle();
  if (!acceptance) return { sent: false, reason: "not_found" };

  const providerName = (acceptance.providers as { name: string } | null)?.name ?? "Un prestataire";
  const acceptedAt = new Date(acceptance.accepted_at).toLocaleString("fr-FR", {
    timeZone: "Asia/Jerusalem", dateStyle: "long", timeStyle: "short",
  });
  const html = renderPartnerEmail({
    lang: "fr",
    eyebrow: "Back-office",
    banner: "Conditions partenaires acceptées",
    intro: `${providerName} a accepté les conditions partenaires en ligne.`,
    rows: [
      { label: "Prestataire", value: providerName },
      { label: "Version", value: String(acceptance.version) },
      { label: "Signataire", value: acceptance.signer_name },
      { label: "Date (heure d'Israël)", value: acceptedAt },
    ],
    cta: { label: "Ouvrir la fiche", url: `${PARTNER_SITE_URL}/admin/partenaires/${acceptance.provider_id}` },
    contact: "Email interne envoyé par l'espace partenaire.",
  });
  const sent = await sendPartnerEmail([TEAM_EMAIL], `Conditions acceptées : ${providerName}`, html);
  return { sent: sent.ok };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    if (!(await isInternalCron(req, supabase))) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));

    if (body.event === "preview") {
      if (typeof body.to !== "string" || !(await isAdminEmail(supabase, body.to))) return json({ error: "Forbidden" }, 403);
      const lang = partnerLang(body.lang);
      const inOneWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const sample = {
        experienceTitle: lang === "fr" ? "Matin en cuisine à Tel Aviv" : lang === "he" ? "בוקר במטבח תל אביבי" : "A morning in a Tel Aviv kitchen",
        bookingDate: inOneWeek,
        timeSlot: "10:00",
        adults: 2,
        children: 1,
        customerName: "Dana Levi",
        customerLang: "fr",
        specialRequests: lang === "fr" ? "Une personne végétarienne." : lang === "he" ? "משתתף אחד צמחוני." : "One vegetarian guest.",
        bookingRef: "SM-APERCU",
      };
      const results: Record<string, boolean> = {};
      for (const kind of ["paid", "cancelled"] as const) {
        const { subject, html } = buildBookingNotice(kind, lang, sample);
        results[kind] = (await sendPartnerEmail([body.to], `[Aperçu] ${subject}`, html)).ok;
      }
      return json({ success: true, results });
    }

    if (typeof body.id !== "string") return json({ error: "id manquant" }, 400);

    switch (body.event) {
      case "proposal_created":
        return json(await notifyProposalCreated(supabase, body.id));
      case "terms_accepted":
        return json(await notifyTermsAccepted(supabase, body.id));
      case "booking_paid":
        return json(await notifyProviderOfBooking(supabase, body.id, "paid"));
      case "booking_cancelled":
        return json(await notifyProviderOfBooking(supabase, body.id, "cancelled"));
      default:
        return json({ error: "Événement inconnu" }, 400);
    }
  } catch (err) {
    console.error("partner-notify error:", err);
    return json({ error: "Erreur interne", details: (err as Error).message }, 500);
  }
});
