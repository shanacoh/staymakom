// partner-invite — bouton « Inviter » de la fiche prestataire (réservé aux admins connectés).
//
// Crée l'accès à l'espace partenaire pour un email (par défaut celui du contact principal) :
// le compte s'il n'existe pas, le rôle « partenaire » et le lien utilisateur → prestataire, en une
// seule opération en base. Puis envoie le lien de connexion par email, dans la langue du prestataire.
// Aucun message WhatsApp n'est envoyé d'ici : le back-office propose seulement de le copier.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { partnerCorsHeaders, partnerLang } from "../_shared/partner/email.ts";
import { partnerLoginPageUrl, sendPartnerAccessEmail } from "../_shared/partner/access.ts";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REFUSALS: Record<string, string> = {
  role_conflict: "Cette adresse est déjà celle d'un compte admin ou hôtelier : elle ne peut pas devenir un compte partenaire.",
  already_linked_to_another_provider: "Cette adresse est déjà reliée à un autre prestataire.",
};

Deno.serve(async (req: Request) => {
  const corsHeaders = partnerCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Qui appelle ? Un admin connecté, et personne d'autre.
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: { user: caller } } = await supabase.auth.getUser(token);
    if (!caller) return json({ error: "Action réservée aux administrateurs" }, 403);
    const { data: adminRole } = await supabase
      .from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").maybeSingle();
    if (!adminRole) return json({ error: "Action réservée aux administrateurs" }, 403);

    const body = await req.json().catch(() => ({}));
    if (typeof body.provider_id !== "string") return json({ error: "provider_id manquant" }, 400);

    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, name, email, language, contact_name, status, provider_type")
      .eq("id", body.provider_id)
      .maybeSingle();
    if (providerError || !provider) return json({ error: "Prestataire introuvable" }, 404);
    if (provider.status === "arrete") return json({ error: "Ce prestataire est au statut « Arrêté » : il ne peut pas être invité." }, 400);
    // V0 : l'espace partenaire ne couvre que les expériences et les bateaux.
    if (provider.provider_type === "hotel") return json({ error: "L'espace partenaire n'est pas encore ouvert aux hôtels." }, 400);

    const email = String(body.email ?? provider.email ?? "").trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      return json({ error: "Ce prestataire n'a pas d'email de contact valide. Renseigne-le sur sa fiche, puis réessaie." }, 400);
    }

    // Le compte : celui qui existe déjà pour cet email, sinon un nouveau (sans mot de passe).
    const { data: existingId, error: findError } = await supabase.rpc("admin_find_user_id_by_email", { p_email: email });
    if (findError) throw findError;
    let userId: string | null = existingId ?? null;
    if (!userId) {
      const lang = partnerLang(provider.language);
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          role: "partner",
          display_name: provider.contact_name || provider.name,
          // Le profil ne connaît que « en » et « he ».
          locale: lang === "he" ? "he" : "en",
        },
      });
      if (createError || !created?.user) throw createError ?? new Error("Création du compte impossible");
      userId = created.user.id;
    }

    const { error: linkError } = await supabase.rpc("admin_link_partner_user", {
      p_provider_id: provider.id,
      p_user_id: userId,
      p_email: email,
      p_invited_by: caller.id,
    });
    if (linkError) {
      const refusal = Object.keys(REFUSALS).find((code) => linkError.message?.includes(code));
      if (refusal) return json({ error: REFUSALS[refusal] }, 409);
      throw linkError;
    }

    const sent = await sendPartnerAccessEmail(supabase, {
      kind: "invite",
      email,
      lang: partnerLang(provider.language),
      providerName: provider.name,
      contactName: provider.contact_name,
    });
    if (!sent.ok) {
      return json({ error: "L'accès est créé, mais l'email n'est pas parti. Réessaie d'inviter.", details: sent.details }, 502);
    }

    await supabase.from("provider_users").update({ last_link_sent_at: new Date().toISOString() }).eq("user_id", userId);

    return json({ success: true, email, login_url: partnerLoginPageUrl(email) });
  } catch (err) {
    console.error("partner-invite error:", err);
    return json({ error: "Erreur interne", details: (err as Error).message }, 500);
  }
});
