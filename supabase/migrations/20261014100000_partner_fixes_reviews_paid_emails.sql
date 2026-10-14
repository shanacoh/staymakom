-- Chantier Partenaires, prompt 3 : deux correctifs côté base.
--
-- 1. Avis : le public ne lit plus les coordonnées des clients.
--    Avant, la règle « reviews_public_read_published » laissait n'importe qui lire un avis publié
--    avec toutes ses colonnes (email, téléphone, compte client). Désormais le site public passe par
--    la vue `reviews_public`, qui ne contient que ce qui s'affiche. La table elle-même n'est plus
--    lisible que par l'admin (règle « reviews_admin_all », inchangée).
--
-- 2. Paiement confirmé en retard : les emails partent quand même.
--    Quand une réservation devient payée (paid ou deposit_paid), quel que soit le chemin (paiement
--    immédiat, webhook Revolut, filet de sécurité, admin), la base demande l'envoi :
--      - de l'email au prestataire, si `provider_notified_at` est vide ;
--      - de la confirmation au client, si `confirmation_email_sent_at` est vide et que la
--        réservation vient du site (une réservation saisie par l'admin garde son bouton d'envoi).
--    Les fonctions d'envoi « prennent » la réservation avant d'envoyer : jamais d'email en double.

-- 1. Avis -------------------------------------------------------------------------------------------
create view public.reviews_public
with (security_invoker = false)
as
select
  id,
  scope,
  standalone_experience_id,
  experience2_id,
  provider_id,
  customer_first_name,
  customer_last_initial,
  rating,
  comment,
  lang,
  photo_url,
  review_date,
  is_pinned,
  booking_id,
  staff_reply,
  staff_reply_at,
  moderation_status,
  created_at
from public.reviews
where moderation_status = 'published';

comment on view public.reviews_public is
  'Avis publiés, sans les coordonnées des clients : seule source de lecture des avis pour le site public.';

revoke all on public.reviews_public from public, anon, authenticated;
grant select on public.reviews_public to anon, authenticated;

drop policy if exists "reviews_public_read_published" on public.reviews;

-- 2. Paiement confirmé : emails client et prestataire -----------------------------------------------
create function public.standalone_booking_paid_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  if new.payment_status not in ('paid', 'deposit_paid')
     or new.status = 'cancelled' or coalesce(new.is_cancelled, false) then
    return null;
  end if;

  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'internal_cron_secret';

  -- Confirmation client : seulement pour une réservation faite sur le site, jamais envoyée.
  -- Cette fonction prévient aussi le prestataire dans la foulée.
  if new.confirmation_email_sent_at is null and coalesce(new.source, 'online') <> 'manual_admin' then
    perform net.http_post(
      url := 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/functions/v1/send-standalone-booking-confirmation',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
      body := jsonb_build_object('confirmation_token', new.confirmation_token),
      timeout_milliseconds := 20000
    );
  elsif new.provider_notified_at is null then
    perform public.partner_notify('booking_paid', new.id);
  end if;
  return null;
exception when others then
  -- L'envoi ne doit jamais bloquer l'enregistrement du paiement.
  raise warning 'standalone_booking_paid_notify(%) : %', new.id, sqlerrm;
  return null;
end;
$$;

revoke all on function public.standalone_booking_paid_notify() from public, anon, authenticated;

create trigger standalone_booking_paid_notify_on_update
  after update of payment_status on public.standalone_bookings
  for each row
  when (
    new.payment_status in ('paid', 'deposit_paid')
    and old.payment_status is distinct from new.payment_status
    and (new.provider_notified_at is null or new.confirmation_email_sent_at is null)
  )
  execute function public.standalone_booking_paid_notify();

create trigger standalone_booking_paid_notify_on_insert
  after insert on public.standalone_bookings
  for each row
  when (
    new.payment_status in ('paid', 'deposit_paid')
    and (new.provider_notified_at is null or new.confirmation_email_sent_at is null)
  )
  execute function public.standalone_booking_paid_notify();
