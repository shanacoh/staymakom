-- Bateaux : les clics sur « Demander sur WhatsApp » (cartes /boat) sortent du flux Réservations.
--
-- Un clic ne prouve pas que le client a envoyé son message WhatsApp : on ne connaît ni son nom
-- ni son numéro. Ces lignes (source = 'card_whatsapp', sans numéro) ne s'affichent donc plus
-- dans le flux Réservations mais dans une liste à part « Clics WhatsApp », avec la référence
-- glissée dans le message pré-rempli (6 premiers caractères de l'identifiant, en majuscules).
-- Dès qu'un numéro est saisi sur la ligne (le client a écrit), elle rejoint le flux normal.
-- Rien n'est supprimé.

begin;

-- 1. Vue admin_reservations : même définition, avec une condition en plus sur la partie demandes.
--    On repart de la définition en place pour ne rien perdre des autres parties de la vue.
do $$
declare
  current_def text := pg_get_viewdef('public.admin_reservations'::regclass, true);
  old_filter text := 'WHERE r.status = ANY (ARRAY[''new''::text, ''sent_to_provider''::text, ''contacted''::text, ''availability_confirmed''::text])';
  new_filter text := old_filter || ' AND (r.source IS DISTINCT FROM ''card_whatsapp''::text OR NULLIF(r.customer_phone, ''''::text) IS NOT NULL)';
  new_def text;
begin
  if position('card_whatsapp' in current_def) > 0 then
    return; -- déjà appliquée
  end if;
  new_def := replace(current_def, old_filter, new_filter);
  if new_def = current_def then
    raise exception 'Filtre des demandes introuvable dans admin_reservations : migration à revoir';
  end if;
  execute 'create or replace view public.admin_reservations with (security_invoker = true) as ' || new_def;
end $$;

-- 2. Liste « Clics WhatsApp » : clics encore sans numéro, demandes actives seulement.
create or replace view public.admin_boat_whatsapp_clicks
with (security_invoker = true) as
select
  r.id,
  upper(left(r.id::text, 6)) as ref,
  r.created_at as clicked_at,
  coalesce(e.title_fr, e.title, 'Bateau') as product,
  e.city,
  r.adults as persons,
  r.requested_duration_minutes as duration_minutes,
  r.requested_date,
  r.message as date_range,
  r.desired_time_period = 'sunset' as sunset,
  r.is_urgent,
  r.language
from public.standalone_experience_requests r
left join public.standalone_experiences e on e.id = r.experience_id
where r.source = 'card_whatsapp'
  and nullif(r.customer_phone, '') is null
  and r.status in ('new', 'sent_to_provider', 'contacted', 'availability_confirmed');

comment on view public.admin_boat_whatsapp_clicks is
  'Clics « Demander sur WhatsApp » des cartes bateau, sans numéro connu. Référence = celle du message WhatsApp pré-rempli.';

grant select on public.admin_boat_whatsapp_clicks to authenticated;

commit;
