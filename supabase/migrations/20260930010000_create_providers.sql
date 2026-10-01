-- Fiche prestataire unique (bateaux, activités, etc.)
-- Objectif : remplacer à terme les 3 endroits où le prestataire est stocké en texte libre
-- (standalone_experiences.supplier_*, standalone_experience_suppliers.supplier_name,
-- standalone_bookings.supplier_name) par une vraie fiche centrale, réutilisable partout.
-- Cette migration ne touche à aucune donnée existante : elle crée seulement la nouvelle table,
-- vide pour l'instant. Le lien avec l'existant se fera dans une étape suivante.

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text,
  email text,
  language text,
  conditions text,
  cancellation_weather_policy text,
  policy_validated boolean not null default false,
  internal_notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.providers is 'Fiche prestataire unique (contact, langue, conditions, politique annulation/météo). Source de vérité, remplace les champs texte libre historiques.';
comment on column public.providers.policy_validated is 'true si le prestataire a validé notre politique annulation/météo (72h + décision skipper mer agitée). Sinon badge rouge "Politique non validée" partout dans le back-office.';

create or replace function update_providers_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_providers_updated_at
  before update on public.providers
  for each row execute function update_providers_updated_at();

alter table public.providers enable row level security;

create policy "providers_admin_all"
  on public.providers for all
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'));
