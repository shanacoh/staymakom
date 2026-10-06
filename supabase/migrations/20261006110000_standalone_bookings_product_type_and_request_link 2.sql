-- Refonte Réservations, migration 2.
-- 1) Type de produit (Expérience / Bateau) stocké sur la réservation, pour qu'une
--    réservation saisie à la main sans fiche catalogue puisse être reconnue comme bateau.
-- 2) Lien vers la demande d'origine, pour qu'une demande convertie ne laisse que sa réservation.
begin;

alter table public.standalone_bookings add column product_type text;
alter table public.standalone_bookings
  add column request_id uuid references public.standalone_experience_requests(id) on delete set null;

comment on column public.standalone_bookings.product_type is 'experience | boat. Rempli automatiquement à la création d''après la fiche liée, modifiable à la main ensuite.';
comment on column public.standalone_bookings.request_id is 'Demande (standalone_experience_requests) dont cette réservation est issue, si elle vient d''une demande.';

-- Reprise de l'existant : bateau si la fiche liée est dans la catégorie Bateaux, ou si la
-- réservation manuelle sans fiche porte un titre « Boat Day... » (liste validée par Shana le 06/10/2026).
-- On suspend le déclencheur de date de modification le temps de la reprise : ce remplissage
-- technique ne doit pas faire croire que toutes les réservations ont été modifiées aujourd'hui.
alter table public.standalone_bookings disable trigger trg_standalone_bookings_updated_at;
update public.standalone_bookings b
set product_type = case
  when exists (
    select 1 from public.standalone_experiences e
    join public.categories c on c.id = e.category_id
    where e.id = b.standalone_experience_id and c.slug = 'bateaux'
  ) then 'boat'
  when b.standalone_experience_id is null and b.custom_experience_title ilike 'boat day%' then 'boat'
  else 'experience'
end;
alter table public.standalone_bookings enable trigger trg_standalone_bookings_updated_at;

alter table public.standalone_bookings alter column product_type set not null;
alter table public.standalone_bookings
  add constraint standalone_bookings_product_type_check check (product_type in ('experience', 'boat'));

-- Une demande ne donne qu'une seule réservation.
create unique index standalone_bookings_request_id_key
  on public.standalone_bookings(request_id) where request_id is not null;

-- À la création, le type se déduit de la fiche liée quand il n'est pas précisé. Les parcours
-- existants (paiement en ligne, saisie manuelle) n'ont donc rien à changer.
-- « security definer » : hors saison la catégorie Bateaux est en brouillon et n'est plus
-- lisible par tout le monde ; la fonction ne fait que lire, elle doit toujours la voir.
create or replace function public.set_standalone_booking_product_type()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.product_type is null then
    new.product_type := case
      when exists (
        select 1 from public.standalone_experiences e
        join public.categories c on c.id = e.category_id
        where e.id = new.standalone_experience_id and c.slug = 'bateaux'
      ) then 'boat'
      else 'experience'
    end;
  end if;
  return new;
end;
$$;

create trigger standalone_bookings_set_product_type
  before insert on public.standalone_bookings
  for each row execute function public.set_standalone_booking_product_type();

-- Conversion d'une demande en réservation : le lien et le statut « convertie » sont écrits
-- ensemble (tout ou rien). S'exécute avec les droits de l'appelant : seules les personnes
-- autorisées à modifier ces deux tables (les admins) peuvent s'en servir.
create or replace function public.link_request_to_booking(p_request_id uuid, p_booking_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.standalone_bookings set request_id = p_request_id where id = p_booking_id;
  if not found then
    raise exception 'Réservation introuvable ou non modifiable';
  end if;
  update public.standalone_experience_requests set status = 'converted' where id = p_request_id;
  if not found then
    raise exception 'Demande introuvable ou non modifiable';
  end if;
end;
$$;

revoke execute on function public.link_request_to_booking(uuid, uuid) from anon, public;
grant execute on function public.link_request_to_booking(uuid, uuid) to authenticated;

commit;
