-- Réservations v2, lot 5 : marquage « À vérifier » dans la grille de Saisie.
--
-- L'équivalent des cellules rouges de l'Excel de Shana : un clic droit sur une ligne la marque
-- « à vérifier », avec une note. Une table à part, commune aux quatre sortes de lignes de la page
-- (réservation, demande, hôtel, dossier) : aucune table de réservation n'est modifiée.

begin;

create table public.reservation_flags (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('booking', 'request', 'hotel', 'dossier')),
  row_id uuid not null,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  unique (source, row_id)
);

comment on table public.reservation_flags is
  'Lignes de la page Réservations marquées « à vérifier » (clic droit dans la Saisie), avec une note.';

alter table public.reservation_flags enable row level security;

create policy reservation_flags_admin_all on public.reservation_flags
  for all
  using (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = 'admin'::app_role))
  with check (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = 'admin'::app_role));

revoke all on public.reservation_flags from anon;
grant select, insert, update, delete on public.reservation_flags to authenticated;

commit;
