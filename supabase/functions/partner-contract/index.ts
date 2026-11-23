// partner-contract — le PDF du contrat hôtel signé en ligne.
//
// Deux actions, réservées à l'hôtel qui a signé (connecté) et aux admins :
//  - finalize : génère le PDF du contrat rempli (texte tel que signé, signature STAYMAKOM déposée une
//    fois dans le back-office, signature de l'hôtel, trace : version, date et heure, nom, fonction,
//    utilisateur, IP, navigateur), le range dans le stockage privé `partner-contracts`, puis l'envoie
//    par email aux deux parties. Sans effet si c'est déjà fait (on peut le rappeler sans risque).
//  - download : une adresse de téléchargement valable 10 minutes.
//
// La signature elle-même est déjà enregistrée en base (partner_sign_contract) : si cette fonction
// échoue, le contrat reste signé et le PDF peut être régénéré plus tard.
//
// Copie équipe : l'adresse du réglage PARTNER_TEAM_EMAIL, sinon celle des comptes admin.
//
// Hébreu : le texte est écrit avec Noto Sans Hebrew, dans le sens droite-à-gauche (voir pdf.ts, bidi.ts).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildContractPdf, type ContractAcceptance } from "./pdf.ts";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";
import { partnerCorsHeaders, partnerLang, renderPartnerEmail, sendPartnerEmail, PARTNER_SPACE_URL } from "../_shared/partner/email.ts";

const BUCKET = "partner-contracts";
const STAYMAKOM_SIGNATURE = "staymakom/signature.png";

// deno-lint-ignore no-explicit-any
type Client = any;

// Noto Sans Hebrew (Google, licence libre), version figée, gardée en mémoire entre deux appels.
const HEBREW_FONT_URLS = {
  regular: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-hebrew@5.2.5/hebrew-400-normal.ttf",
  bold: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-hebrew@5.2.5/hebrew-700-normal.ttf",
};
const fontCache: Partial<Record<keyof typeof HEBREW_FONT_URLS, Uint8Array>> = {};

/** La police hébraïque ; sans elle (réseau indisponible), le PDF est quand même produit. */
async function hebrewFont(weight: keyof typeof HEBREW_FONT_URLS): Promise<Uint8Array | null> {
  if (fontCache[weight]) return fontCache[weight]!;
  try {
    const response = await fetch(HEBREW_FONT_URLS[weight]);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    fontCache[weight] = new Uint8Array(await response.arrayBuffer());
    return fontCache[weight]!;
  } catch (error) {
    console.error(`Police hébraïque (${weight}) indisponible :`, error);
    return null;
  }
}

async function buildPdf(supabase: Client, a: ContractAcceptance): Promise<Uint8Array> {
  const { data: ours } = await supabase.storage.from(BUCKET).download(STAYMAKOM_SIGNATURE);
  const [hebrewRegular, hebrewBold] = await Promise.all([hebrewFont("regular"), hebrewFont("bold")]);
  return buildContractPdf({
    acceptance: a,
    hebrewRegular,
    hebrewBold,
    staymakomSignature: ours ? new Uint8Array(await ours.arrayBuffer()) : null,
  });
}

/** L'adresse de l'équipe : le réglage du serveur, sinon les comptes admin. */
async function teamRecipients(supabase: Client): Promise<string[]> {
  const configured = Deno.env.get("PARTNER_TEAM_EMAIL");
  if (configured) return [configured];
  const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin").limit(5);
  const emails: string[] = [];
  for (const row of admins ?? []) {
    const { data } = await supabase.auth.admin.getUserById(row.user_id);
    if (data?.user?.email) emails.push(data.user.email);
  }
  return emails;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = partnerCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ error: "Connexion requise" }, 401);

    const body = await req.json().catch(() => ({}));
    if (typeof body.acceptance_id !== "string") return json({ error: "acceptance_id manquant" }, 400);

    const { data: acceptance } = await supabase
      .from("partner_terms_acceptances")
      .select("id, provider_id, user_id, version, kind, signer_name, signer_title, signature_data, accepted_at, ip_address, user_agent, commission_snapshot, contract_variables, rendered_text, contract_pdf_path, contract_emailed_at")
      .eq("id", body.acceptance_id)
      .maybeSingle();
    if (!acceptance || acceptance.kind !== "hotel_contract") return json({ error: "Contrat introuvable" }, 404);

    // Seuls l'hôtel concerné (un de ses utilisateurs) et les admins y ont accès.
    const [{ data: link }, { data: admin }] = await Promise.all([
      supabase.from("provider_users").select("id").eq("user_id", user.id).eq("provider_id", acceptance.provider_id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
    ]);
    if (!link && !admin) return json({ error: "Contrat introuvable" }, 404);

    if (body.action === "download") {
      if (!acceptance.contract_pdf_path) return json({ error: "PDF pas encore prêt" }, 404);
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(acceptance.contract_pdf_path, 600);
      if (error || !data) return json({ error: "Téléchargement impossible" }, 500);
      return json({ url: data.signedUrl });
    }

    if (body.action !== "finalize") return json({ error: "Action inconnue" }, 400);

    let path = acceptance.contract_pdf_path as string | null;
    let bytes: Uint8Array | null = null;
    if (!path) {
      bytes = await buildPdf(supabase, acceptance as ContractAcceptance);
      path = `${acceptance.provider_id}/${acceptance.id}.pdf`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: "application/pdf", upsert: true });
      if (uploadError) throw uploadError;
      await supabase.from("partner_terms_acceptances").update({ contract_pdf_path: path }).eq("id", acceptance.id).is("contract_pdf_path", null);
    }

    if (acceptance.contract_emailed_at) return json({ success: true, already_sent: true });
    if (!bytes) {
      const { data: file } = await supabase.storage.from(BUCKET).download(path);
      if (!file) throw new Error("PDF introuvable");
      bytes = new Uint8Array(await file.arrayBuffer());
    }

    // L'email part aux deux parties : l'hôtel (contact principal et signataire) et l'équipe.
    const { data: provider } = await supabase.from("providers").select("name, email, language").eq("id", acceptance.provider_id).maybeSingle();
    const lang = partnerLang(provider?.language);
    const texts = {
      en: { banner: "Contract signed", intro: "Thank you. Your STAYMAKOM partner contract is signed. The signed PDF is attached; it is also available in your partner space.", cta: "Open my partner space", contact: "Questions? Reply to this email, the STAYMAKOM team will answer." },
      fr: { banner: "Contrat signé", intro: "Merci. Votre contrat partenaire STAYMAKOM est signé. Le PDF signé est en pièce jointe ; il est aussi disponible dans votre espace partenaire.", cta: "Ouvrir mon espace partenaire", contact: "Une question ? Répondez à cet email, l'équipe STAYMAKOM vous répond." },
      he: { banner: "החוזה נחתם", intro: "תודה. חוזה השותפות שלכם עם STAYMAKOM נחתם. ה-PDF החתום מצורף, והוא זמין גם באזור השותפים שלכם.", cta: "לפתוח את אזור השותפים", contact: "שאלות? השיבו למייל הזה, צוות STAYMAKOM יענה לכם." },
    }[lang];
    const hotelName = acceptance.contract_variables?.hotel_name ?? provider?.name ?? "";
    const html = renderPartnerEmail({
      lang,
      eyebrow: "STAYMAKOM",
      banner: texts.banner,
      bannerSub: hotelName,
      intro: texts.intro,
      rows: [
        { label: "Signer", value: `${acceptance.signer_name}${acceptance.signer_title ? `, ${acceptance.signer_title}` : ""}` },
        { label: "Commission", value: acceptance.contract_variables?.commission ?? "" },
        { label: "Date", value: new Date(acceptance.accepted_at).toLocaleString("en-GB", { timeZone: "Asia/Jerusalem", dateStyle: "long", timeStyle: "short" }) },
      ],
      cta: { label: texts.cta, url: `${PARTNER_SPACE_URL}/profile` },
      contact: texts.contact,
    });
    const { data: signer } = acceptance.user_id
      ? await supabase.from("provider_users").select("email").eq("user_id", acceptance.user_id).maybeSingle()
      : { data: null };
    const partnerRecipients = [...new Set([provider?.email, signer?.email].filter((e): e is string => !!e).map((e) => e.toLowerCase()))];
    const attachment = [{ filename: `STAYMAKOM-contract-${acceptance.id.slice(0, 8)}.pdf`, content: encodeBase64(bytes) }];
    const subject = `STAYMAKOM · ${texts.banner} · ${hotelName}`;
    const sentPartner = partnerRecipients.length > 0 ? await sendPartnerEmail(partnerRecipients, subject, html, attachment) : { ok: false };
    const team = await teamRecipients(supabase);
    const sentTeam = team.length > 0 ? await sendPartnerEmail(team, `[Back-office] ${subject}`, html, attachment) : { ok: false };
    if (sentPartner.ok || sentTeam.ok) {
      await supabase.from("partner_terms_acceptances").update({ contract_emailed_at: new Date().toISOString() }).eq("id", acceptance.id);
    }
    return json({ success: true, emailed_partner: sentPartner.ok, emailed_team: sentTeam.ok });
  } catch (err) {
    console.error("partner-contract error:", err);
    return json({ error: "Erreur interne", details: (err as Error).message }, 500);
  }
});
