-- Réservations v2, lot 1 : une demande sort du flux sans être supprimée.
--
-- Cycle de vie : Demande → Envoyée au prestataire → Dispo OK → Convertie (une réservation lui
-- est liée) ou Archivée (« closed », à la main, avec un motif). Les deux états de sortie
-- existent déjà dans la table ; on ajoute le motif, la date de sortie et le lien vers le
-- contact. La vue admin_reservations ne montre déjà que les demandes actives : elle ne change pas.

begin;

-- 1. Motif, note et date de sortie, lien vers le contact ---------------------------------------

alter table public.standalone_experience_requests
  add column lost_reason text
    check (lost_reason in ('prix', 'pas_de_dispo', 'client_ne_repond_plus', 'a_reserve_ailleurs', 'date_passee', 'autre')),
  add column lost_note text,
  add column closed_at timestamptz,
  add column lead_id uuid references public.leads(id) on delete set null;

comment on column public.standalone_experience_requests.lost_reason is
  'Motif d''archivage d''une demande sans suite (status = closed).';
comment on column public.standalone_experience_requests.closed_at is
  'Date de sortie du flux : conversion en réservation ou archivage. Vide tant que la demande est active.';
comment on column public.standalone_experience_requests.lead_id is
  'Contact du CRM de cette demande, retrouvé par son email.';

create index standalone_experience_requests_lead_id_idx on public.standalone_experience_requests (lead_id);

-- 2. La date de sortie suit le statut ---------------------------------------------------------
-- Posée à l'entrée en Convertie ou Archivée, effacée (avec le motif) quand la demande est
-- réouverte : elle ne peut pas rester active avec un motif de sortie.

create or replace function public.standalone_request_track_closing()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status in ('converted', 'closed') then
    if old.status not in ('converted', 'closed') or new.closed_at is null then
      new.closed_at := coalesce(new.closed_at, now());
    end if;
  else
    new.closed_at := null;
    new.lost_reason := null;
    new.lost_note := null;
  end if;
  return new;
end;
$$;

create trigger standalone_request_track_closing
  before update of status on public.standalone_experience_requests
  for each row execute function public.standalone_request_track_closing();

-- 3. Une nouvelle demande est rattachée à son contact ----------------------------------------
-- Seulement un contact qui existe déjà : la demande du site ne crée rien de plus qu'avant, et
-- un échec du rapprochement ne bloque jamais l'enregistrement de la demande.

create or replace function public.standalone_request_link_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    select l.id into new.lead_id
    from public.leads l
    where l.email_normalized = lower(trim(new.customer_email))
    order by l.created_at
    limit 1;
  exception when others then
    raise warning 'standalone_request_link_lead: rapprochement impossible pour % : %', new.customer_email, sqlerrm;
  end;
  return new;
end;
$$;

create trigger standalone_request_link_lead
  before insert on public.standalone_experience_requests
  for each row
  when (new.lead_id is null and new.customer_email is not null and new.customer_email <> '')
  execute function public.standalone_request_link_lead();

-- 4. La conversion lie la réservation et sort la demande du flux, en une seule opération --------

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
  update public.standalone_experience_requests
  set status = 'converted', lost_reason = null, lost_note = null
  where id = p_request_id;
  if not found then
    raise exception 'Demande introuvable ou non modifiable';
  end if;
end;
$$;

-- 5. Vue des Archives ----------------------------------------------------------------------------
-- Une ligne par demande sortie du flux. Mêmes droits que la table (admins seulement).

create view public.admin_request_archives
with (security_invoker = true) as
select
  r.id,
  r.created_at as received_at,
  coalesce(nullif(r.customer_name, ''), 'Sans nom') as client,
  r.customer_phone as phone,
  r.customer_email as email,
  coalesce(e.title_fr, e.title, r.preferred_city, 'Demande') as product,
  case when c.slug = 'bateaux' then 'boat' else 'experience' end as type,
  r.requested_date,
  case
    when r.party_max is not null and r.party_max <> r.adults then r.adults::text || '-' || r.party_max::text
    else (r.adults + r.children)::text
  end as pax,
  r.status as exit_status,
  r.lost_reason,
  r.lost_note,
  r.closed_at,
  r.lead_id,
  b.id as booking_id,
  coalesce(r.source, 'form') as origin
from public.standalone_experience_requests r
left join public.standalone_experiences e on e.id = r.experience_id
left join public.categories c on c.id = e.category_id
left join lateral (
  select sb.id from public.standalone_bookings sb where sb.request_id = r.id order by sb.created_at limit 1
) b on true
where r.status in ('converted', 'closed');

comment on view public.admin_request_archives is
  'Archives de la page Réservations : demandes converties ou archivées, avec leur motif.';

-- 6. Données en place ---------------------------------------------------------------------------

-- Contact de chaque demande déjà reçue.
update public.standalone_experience_requests r
set lead_id = l.id
from (
  select distinct on (email_normalized) id, email_normalized
  from public.leads
  where email_normalized is not null
  order by email_normalized, created_at
) l
where r.lead_id is null
  and l.email_normalized = lower(trim(r.customer_email));

-- Demandes encore actives dont la date est passée (les 7 bateaux d'août) : archivées « Date passée ».
update public.standalone_experience_requests
set status = 'closed', lost_reason = 'date_passee'
where status in ('new', 'sent_to_provider', 'contacted', 'availability_confirmed')
  and requested_date < (now() at time zone 'Asia/Jerusalem')::date;

-- Clic sur le bouton WhatsApp du catamaran (30/09) marqué « converti » sans réservation derrière.
update public.standalone_experience_requests r
set status = 'closed', lost_reason = 'client_ne_repond_plus'
where r.id = 'fe21d7ce-a9f8-4f56-a615-7c957edb4e40'
  and r.status = 'converted'
  and not exists (select 1 from public.standalone_bookings b where b.request_id = r.id);

commit;
