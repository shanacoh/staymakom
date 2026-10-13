// partner-login-link — « Recevoir mon lien de connexion » de la page de connexion de l'espace partenaire.
//
// Appelable sans être connecté (c'est le principe), donc avec trois garde-fous :
//  - un lien ne part que vers une adresse déjà invitée par un admin (aucun compte n'est créé ici) ;
//  - un lien par minute au plus pour une même adresse ;
//  - la réponse est toujours la même, que l'adresse soit connue ou non : impossible de s'en servir
//    pour savoir qui est partenaire.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { partnerCorsHeaders, partnerLang } from "../_shared/partner/email.ts";
import { sendPartnerAccessEmail } from "../_shared/partner/access.ts";

const MIN_DELAY_MS = 60 * 1000;

Deno.serve(async (req: Request) => {
  const corsHeaders = partnerCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email.includes("@") || email.length > 200) return json({ success: true });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: access } = await supabase
      .from("provider_users")
      .select("id, email, last_link_sent_at, providers(name, language, contact_name, status)")
      .eq("email", email)
      .maybeSingle();
    const provider = access?.providers as { name: string; language: string | null; contact_name: string | null; status: string } | null;
    if (!access || !provider || provider.status === "arrete") return json({ success: true });

    // Un lien par minute : on « prend » le droit d'envoyer en posant la date seulement si elle est assez ancienne.
    const now = new Date();
    const threshold = new Date(now.getTime() - MIN_DELAY_MS).toISOString();
    const { data: claimed } = await supabase
      .from("provider_users")
      .update({ last_link_sent_at: now.toISOString() })
      .eq("id", access.id)
      .or(`last_link_sent_at.is.null,last_link_sent_at.lt.${threshold}`)
      .select("id");
    if (!claimed || claimed.length === 0) return json({ success: true });

    const sent = await sendPartnerAccessEmail(supabase, {
      kind: "login",
      email: access.email,
      lang: partnerLang(provider.language),
      providerName: provider.name,
      contactName: provider.contact_name,
    });
    if (!sent.ok) {
      // L'email n'est pas parti : on rend le droit d'envoyer pour qu'un nouvel essai soit possible tout de suite.
      await supabase.from("provider_users").update({ last_link_sent_at: access.last_link_sent_at }).eq("id", access.id);
      console.error("partner-login-link: envoi impossible", sent.details);
    }
    return json({ success: true });
  } catch (err) {
    console.error("partner-login-link error:", err);
    return json({ success: true });
  }
});
