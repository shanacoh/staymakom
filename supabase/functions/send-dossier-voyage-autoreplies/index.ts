// Étape 10 du chantier "Dossier de voyage" : réponse automatique aux demandes arrivées par le
// formulaire "Créer mon voyage" du site. À appeler périodiquement (toutes les quelques minutes),
// par le même mécanisme externe non versionné dans ce dépôt qui déclenche déjà send-review-requests
// (voir son commentaire d'en-tête). Supporte { preview: true } pour voir le rendu sans rien envoyer,
// conformément à la convention du registre src/config/automations.ts.
//
// Langue : faute d'information de langue remontée par le formulaire public à ce jour, l'email part
// en français par défaut (la banque de questions a déjà ses traductions EN/HE prêtes pour le jour où
// cette info sera transmise par le formulaire).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import { getAdminEmail } from "../_shared/internal-auth.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const ALLOWED_ORIGINS = [
  "https://staymakom.com",
  "https://www.staymakom.com",
  "https://stay-makom-experiences.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });
}

const escapeHTML = (str: string): string =>
  (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Mêmes règles que côté collect-lead : jamais la nuit (22h-7h heure d'Israël), jamais pendant
// Shabbat (approximation prudente : vendredi dès 15h jusqu'à samedi minuit).
function estMomentConvenable(date: Date): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem", weekday: "short", hour: "numeric", hour12: false,
  }).formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const heure = Number(parts.find((p) => p.type === "hour")?.value ?? "12");
  const estShabbat = (weekday === "Fri" && heure >= 15) || weekday === "Sat";
  const estNuit = heure >= 22 || heure < 7;
  return !estShabbat && !estNuit;
}

interface Question {
  champ_manquant: string;
  texte_fr: string;
}

function champsManquants(dossier: { dates_arrivee: string | null; regions: string[] | null; brief_data: Record<string, unknown> }): string[] {
  const manquants: string[] = [];
  if (!dossier.dates_arrivee) manquants.push("dates_exactes");
  if (!dossier.regions || dossier.regions.length === 0) manquants.push("regions");
  if (!dossier.brief_data?.contraintes) manquants.push("contraintes");
  if (!dossier.brief_data?.budget) manquants.push("budget");
  if (!dossier.brief_data?.envies && !dossier.brief_data?.moods && !dossier.brief_data?.description) manquants.push("envies");
  return manquants;
}

function buildEmailHtml(params: { prenom: string; questions: string[] }): string {
  const heroImageUrl = "https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public/NL/email/confirmation-hero-desert-road.jpg";
  const brandRed = "#ad1414";
  const questionsHtml = params.questions
    .map((q) => `<li style="margin-bottom:10px;font-size:14px;color:#1a1a1a;line-height:1.5;">${escapeHTML(q)}</li>`)
    .join("");

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Votre demande de voyage — StayMakom</title>
  <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');</style>
</head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td background="${heroImageUrl}" bgcolor="#1a1a1a" style="background-image:url('${heroImageUrl}');background-size:cover;background-position:center;padding:44px 40px;text-align:center;">
              <p style="margin:0 0 10px;color:rgba(255,255,255,0.75);font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;text-shadow:0 2px 12px rgba(0,0,0,0.5);">Votre voyage sur mesure</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;text-shadow:0 2px 20px rgba(0,0,0,0.5);">STAYMAKOM</h1>
            </td>
          </tr>
          <tr>
            <td style="background:#FAF9F6;padding:24px 40px;text-align:center;border-bottom:1px solid #eee;">
              <p style="margin:0;font-size:16px;font-weight:700;color:${brandRed};">✓ Demande bien reçue</p>
              <p style="margin:6px 0 0;font-size:14px;color:#666;">On commence déjà à préparer ton voyage.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#1a1a1a;">Coucou ${escapeHTML(params.prenom)},</p>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                Merci pour ta demande ! J'ai hâte de te préparer un voyage qui te ressemble.
                Pour affiner la proposition, j'aurais besoin de quelques précisions :
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF9F6;border-radius:8px;border:1px solid #eee;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <ul style="margin:0;padding-left:18px;">${questionsHtml}</ul>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:14px;color:#888;line-height:1.6;">
                Tu peux simplement répondre à cet email — je m'occupe du reste.<br/>
                À très vite,<br/>Shana
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:24px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#1a1a1a;">StayMakom</p>
              <p style="margin:6px 0 0;font-size:12px;color:#999;">The Israel most people never find.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const preview = body?.preview === true;
    // L'aperçu montre de vraies données : il est réservé aux admins connectés.
    if (preview && !(await getAdminEmail(req, supabase))) return json(req, { error: "Action réservée aux administrateurs" }, 403);

    const { data: banque, error: banqueError } = await supabase
      .from("autoreply_question_bank")
      .select("champ_manquant, texte_fr")
      .eq("actif", true)
      .order("ordre", { ascending: true });
    if (banqueError) return json(req, { error: "Impossible de lire la banque de questions" }, 500);

    if (preview) {
      const dossierId = typeof body?.dossierId === "string" ? body.dossierId : null;
      const { data: dossier } = await supabase
        .from("dossiers_voyage")
        .select("nom_destinataire, dates_arrivee, regions, brief_data")
        .eq("id", dossierId ?? "")
        .maybeSingle();
      const d = dossier ?? { nom_destinataire: "Prénom", dates_arrivee: null, regions: [], brief_data: {} };
      const manquants = champsManquants(d as { dates_arrivee: string | null; regions: string[] | null; brief_data: Record<string, unknown> });
      const questions = (banque as Question[])
        .filter((q) => manquants.includes(q.champ_manquant))
        .slice(0, 3)
        .map((q) => q.texte_fr);
      const html = buildEmailHtml({ prenom: d.nom_destinataire.split(" ")[0], questions: questions.length > 0 ? questions : ["(aucune question manquante pour ce dossier)"] });
      return json(req, { html, subject: "Votre demande de voyage sur mesure — StayMakom" });
    }

    if (!RESEND_API_KEY) return json(req, { error: "RESEND_API_KEY non configurée" }, 500);

    const maintenant = new Date();
    if (!estMomentConvenable(maintenant)) {
      return json(req, { ok: true, envoyes: 0, raison: "nuit ou Shabbat, aucun envoi ce passage" });
    }

    const { data: dossiersDus, error: dueError } = await supabase
      .from("dossiers_voyage")
      .select("id, nom_destinataire, email, dates_arrivee, regions, brief_data")
      .eq("canal_origine", "formulaire_site")
      .is("autoreply_envoye_at", null)
      .not("autoreply_envoyer_apres", "is", null)
      .lte("autoreply_envoyer_apres", maintenant.toISOString())
      .not("email", "is", null)
      .limit(30);
    if (dueError) return json(req, { error: "Impossible de lire les dossiers à traiter" }, 500);

    let envoyes = 0;
    for (const dossier of dossiersDus ?? []) {
      const manquants = champsManquants(dossier as { dates_arrivee: string | null; regions: string[] | null; brief_data: Record<string, unknown> });
      const questions = (banque as Question[]).filter((q) => manquants.includes(q.champ_manquant)).slice(0, 3).map((q) => q.texte_fr);
      if (questions.length === 0) {
        // Rien à demander : on marque quand même comme traité pour ne pas le relire indéfiniment.
        await supabase.from("dossiers_voyage").update({ autoreply_envoye_at: maintenant.toISOString() }).eq("id", dossier.id);
        continue;
      }

      const html = buildEmailHtml({ prenom: (dossier.nom_destinataire || "").split(" ")[0] || dossier.nom_destinataire, questions });
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Shana @ StayMakom <hello@staymakom.com>",
          reply_to: "shana@staymakom.com",
          to: [dossier.email],
          subject: "Votre demande de voyage sur mesure — StayMakom",
          html,
        }),
      });

      if (!emailResponse.ok) {
        console.error("send-dossier-voyage-autoreplies: échec Resend pour", dossier.id, await emailResponse.text());
        continue; // on retentera au prochain passage, l'envoi n'est pas marqué comme fait
      }

      await supabase.from("dossiers_voyage").update({ autoreply_envoye_at: maintenant.toISOString() }).eq("id", dossier.id);
      envoyes += 1;
    }

    return json(req, { ok: true, envoyes });
  } catch (error) {
    console.error("send-dossier-voyage-autoreplies: erreur inattendue", error);
    return json(req, { error: "Une erreur inattendue est survenue." }, 500);
  }
});
