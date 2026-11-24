-- Un hôtel = un prestataire.
--
-- La commission, l'invitation, le go live et le contrat hôtel vivent sur la fiche prestataire. Jusqu'ici
-- il fallait créer ce prestataire à la main pour chaque hôtel ; aucun des hôtels ne l'était.
--  1. Chaque hôtel sans prestataire reçoit le sien (même nom, même email et téléphone de contact,
--     même région et adresse ; statut « actif » si l'hôtel est publié, sinon « prospect » ;
--     commission vide : elle se saisit quand elle est convenue).
--  2. Désormais, un hôtel enregistré sans prestataire en reçoit un automatiquement, et un hôtel ne
--     peut plus perdre le sien (on peut seulement en choisir un autre, par exemple pour un groupe).
-- Rien d'existant n'est modifié : ni la colonne commission_rate des hôtels, ni les prix.

begin;

create or replace function public.hotel2_internal_ensure_provider()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider uuid;
begin
  if new.provider_id is not null then
    return new;
  end if;
  -- Un hôtel garde son prestataire : effacer le champ ne le détache pas.
  if tg_op = 'UPDATE' and old.provider_id is not null then
    new.provider_id := old.provider_id;
    return new;
  end if;
  -- Enregistrement « insérer ou mettre à jour » d'une ligne qui existe déjà : la mise à jour qui suit s'en charge.
  if tg_op = 'INSERT' and exists (select 1 from public.hotel2_internal i where i.hotel_id = new.hotel_id) then
    return new;
  end if;

  insert into public.providers (name, provider_type, status, email, whatsapp, region_id, address)
  select h.name, 'hotel',
         case when h.status::text = 'published' then 'actif' else 'prospect' end,
         nullif(btrim(new.contact_email), ''), nullif(btrim(new.contact_phone), ''), h.region_id, h.address
  from public.hotels2 h
  where h.id = new.hotel_id
  returning id into v_provider;

  new.provider_id := v_provider;
  return new;
end;
$$;

comment on function public.hotel2_internal_ensure_provider() is
  'Un hôtel = un prestataire : crée le prestataire (type hôtel) d''un hôtel qui n''en a pas, et empêche qu''un hôtel perde le sien.';

revoke all on function public.hotel2_internal_ensure_provider() from public, anon, authenticated;

drop trigger if exists hotel2_internal_ensure_provider on public.hotel2_internal;
create trigger hotel2_internal_ensure_provider
  before insert or update on public.hotel2_internal
  for each row execute function public.hotel2_internal_ensure_provider();

-- Les hôtels existants : un prestataire chacun, créé et relié dans la même transaction.
create temporary table hotel_provider_map on commit drop as
  select h.id as hotel_id, gen_random_uuid() as provider_id
  from public.hotels2 h
  join public.hotel2_internal i on i.hotel_id = h.id
  where i.provider_id is null;

insert into public.providers (id, name, provider_type, status, email, whatsapp, region_id, address)
select m.provider_id, h.name, 'hotel',
       case when h.status::text = 'published' then 'actif' else 'prospect' end,
       nullif(btrim(i.contact_email), ''), nullif(btrim(i.contact_phone), ''), h.region_id, h.address
from hotel_provider_map m
join public.hotels2 h on h.id = m.hotel_id
join public.hotel2_internal i on i.hotel_id = m.hotel_id;

update public.hotel2_internal i
set provider_id = m.provider_id
from hotel_provider_map m
where i.hotel_id = m.hotel_id and i.provider_id is null;

-- Un hôtel qui n'aurait pas encore de ligne interne en reçoit une (le déclencheur crée son prestataire).
insert into public.hotel2_internal (hotel_id)
select h.id from public.hotels2 h
where not exists (select 1 from public.hotel2_internal i where i.hotel_id = h.id);

commit;
