-- Bouton « Aperçu » de l'email du Journal : ouvre le brouillon sans connexion, grâce à un
-- jeton propre à l'email (comme « Rejeter »), mais en LECTURE SEULE, réutilisable et valable
-- 7 jours. Seule la fonction serveur journal-email-action peut lire le brouillon avec ce jeton.

alter table public.journal_action_tokens drop constraint if exists journal_action_tokens_action_check;
alter table public.journal_action_tokens
  add constraint journal_action_tokens_action_check check (action in ('reject', 'preview'));

create or replace function public.journal_post_by_preview_token(p_token_hash text)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $$
  select to_jsonb(p) - 'internal_links' - 'block_reason' - 'to_verify'
    from public.journal_action_tokens t
    join public.journal_posts p on p.id = t.post_id
   where t.token_hash = p_token_hash
     and t.action = 'preview'
     and t.expires_at > now()
   limit 1;
$$;

revoke all on function public.journal_post_by_preview_token(text) from public, anon, authenticated;
grant execute on function public.journal_post_by_preview_token(text) to service_role;
