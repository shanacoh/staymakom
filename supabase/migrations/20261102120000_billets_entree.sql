-- Billets d'entrée envoyés par le prestataire (QR code, PDF, image ou fichier Wallet .pkpass).
-- On ne génère jamais de billet : on range le fichier original du prestataire et on le transmet tel quel.
--
-- Où sont les fichiers : dans le bucket privé `booking-tickets` (jamais public). Seuls les admins
-- peuvent y lire et y écrire. Le client n'y accède que par la page billet (/billet/<jeton>), lue
-- côté serveur, qui fabrique des liens signés de courte durée à chaque affichage.

begin;

-- 1. Fiche expérience : le prestataire envoie-t-il un billet d'entrée ?
alter table public.standalone_experiences
  add column if not exists requires_entry_ticket boolean not null default false;

comment on column public.standalone_experiences.requires_entry_ticket is
  'Billet d''entrée envoyé par le prestataire : à transmettre au client avant l''expérience.';

-- 2. Réservation : note libre, date d'envoi des billets, jeton de la page billet, alerte « billet manquant ».
alter table public.standalone_bookings
  add column if not exists ticket_note text,
  add column if not exists tickets_sent_at timestamptz,
  add column if not exists ticket_access_token text,
  add column if not exists ticket_missing_alert_sent_at timestamptz;

create unique index if not exists standalone_bookings_ticket_access_token_key
  on public.standalone_bookings (ticket_access_token)
  where ticket_access_token is not null;

comment on column public.standalone_bookings.ticket_note is
  'Info billet montrée au client (ex. référence prestataire, ou lien de billetterie sans fichier).';
comment on column public.standalone_bookings.tickets_sent_at is
  'Date du dernier envoi de l''email « Vos billets » (vide = jamais envoyé).';
comment on column public.standalone_bookings.ticket_access_token is
  'Jeton long et aléatoire de la page billet /billet/<jeton>, créé au premier billet déposé.';
comment on column public.standalone_bookings.ticket_missing_alert_sent_at is
  'Date de l''alerte interne « Billet manquant pour demain » (une seule par réservation).';

-- 3. Les fichiers billets d'une réservation (un par participant possible).
create table if not exists public.booking_tickets (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.standalone_bookings(id) on delete cascade,
  storage_path text not null unique,
  file_type text not null check (file_type in ('pdf', 'image', 'pkpass')),
  mime_type text not null,
  original_name text not null,
  label text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists booking_tickets_booking_id_idx on public.booking_tickets (booking_id, position);

alter table public.booking_tickets enable row level security;

drop policy if exists booking_tickets_admin_all on public.booking_tickets;
create policy booking_tickets_admin_all on public.booking_tickets
  for all
  using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Jeton de la page billet : créé avec le premier billet, jamais changé ensuite (le lien déjà
--    envoyé au client reste valable). Même transaction que l'ajout du billet.
create or replace function public.ensure_ticket_access_token()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.standalone_bookings
     set ticket_access_token = encode(extensions.gen_random_bytes(32), 'hex')
   where id = new.booking_id
     and ticket_access_token is null;
  return new;
end;
$$;

drop trigger if exists booking_tickets_ensure_token on public.booking_tickets;
create trigger booking_tickets_ensure_token
  after insert on public.booking_tickets
  for each row execute function public.ensure_ticket_access_token();

-- 5. Nouvel ordre des billets d'une réservation, en une seule fois (tout ou rien).
create or replace function public.reorder_booking_tickets(p_booking_id uuid, p_ticket_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Action réservée aux administrateurs';
  end if;
  update public.booking_tickets t
     set position = o.ord - 1
    from unnest(p_ticket_ids) with ordinality as o(id, ord)
   where t.id = o.id
     and t.booking_id = p_booking_id;
end;
$$;

revoke all on function public.reorder_booking_tickets(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_booking_tickets(uuid, uuid[]) to authenticated;
revoke all on function public.ensure_ticket_access_token() from public, anon, authenticated;

-- 6. Bucket privé des billets : 15 Mo max par fichier, PDF / PNG / JPG / .pkpass uniquement.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'booking-tickets', 'booking-tickets', false, 15728640,
  array['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.apple.pkpass']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists booking_tickets_files_admin_select on storage.objects;
drop policy if exists booking_tickets_files_admin_insert on storage.objects;
drop policy if exists booking_tickets_files_admin_update on storage.objects;
drop policy if exists booking_tickets_files_admin_delete on storage.objects;

create policy booking_tickets_files_admin_select on storage.objects
  for select to authenticated
  using (bucket_id = 'booking-tickets' and public.has_role(auth.uid(), 'admin'::app_role));
create policy booking_tickets_files_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'booking-tickets' and public.has_role(auth.uid(), 'admin'::app_role));
create policy booking_tickets_files_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'booking-tickets' and public.has_role(auth.uid(), 'admin'::app_role));
create policy booking_tickets_files_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'booking-tickets' and public.has_role(auth.uid(), 'admin'::app_role));

commit;
