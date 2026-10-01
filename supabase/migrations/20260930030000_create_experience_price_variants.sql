-- Variantes de prix par durée pour les expériences sur demande (bateaux en premier usage).
-- Objectif : une expérience peut proposer plusieurs durées, chacune avec sa propre
-- capacité max, son prix d'achat et son prix de vente. La marge se calcule dessus.
-- Cette migration ne fusionne aucune fiche existante : chaque fiche bateau actuelle
-- reçoit exactement une variante, reprenant ses valeurs actuelles telles quelles.
-- Les regroupements éventuels (même bateau physique à plusieurs durées) seront traités
-- dans une étape séparée, une fois confirmés par Shana.

create table if not exists public.standalone_experience_price_variants (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.standalone_experiences(id) on delete cascade,
  duration_label text not null,
  duration_minutes integer,
  max_capacity integer not null,
  purchase_price numeric(10,2),
  sale_price numeric(10,2) not null,
  currency text not null default 'ILS',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.standalone_experience_price_variants is 'Variantes de prix par durée (bateaux : 1h/1h30/2h/3h/4h). Une seule source de vérité pour le prix d''achat et de vente par durée, remplace les champs de prix historiques sur standalone_experiences.';
comment on column public.standalone_experience_price_variants.purchase_price is 'Prix d''achat (coût prestataire) pour cette durée. Peut être NULL si pas encore renseigné : le back-office doit rester lisible et signaler "coût manquant" plutôt que planter.';
comment on column public.standalone_experience_price_variants.sale_price is 'Prix de vente groupe (pas par personne) pour cette durée.';

create or replace function update_price_variants_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_price_variants_updated_at
  before update on public.standalone_experience_price_variants
  for each row execute function update_price_variants_updated_at();

alter table public.standalone_experience_price_variants enable row level security;

create policy "price_variants_admin_all"
  on public.standalone_experience_price_variants for all
  using (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'));

create policy "price_variants_public_read"
  on public.standalone_experience_price_variants for select
  using (
    is_active = true
    and exists (
      select 1 from public.standalone_experiences se
      where se.id = experience_id and se.status = 'published'
    )
  );

-- Une variante par fiche bateau existante, reprise à l'identique (aucune fusion).
insert into public.standalone_experience_price_variants
  (experience_id, duration_label, duration_minutes, max_capacity, purchase_price, sale_price, currency)
select
  se.id,
  se.duration,
  case
    when se.duration ilike '%1h30%' or se.duration ilike '%1.5 hour%' then 90
    when se.duration ilike '%1 hour%' then 60
    when se.duration ilike '%2 hour%' or se.duration ilike '%2 to 3%' or se.duration ilike '%min. 2 hour%' then 120
    when se.duration ilike '%3-hour%' or se.duration ilike '%3 hour%' then 180
    when se.duration ilike '%4-hour%' or se.duration ilike '%4 hour%' then 240
    else null
  end,
  se.max_party,
  se.supplier_price_adult,
  se.base_price,
  coalesce(se.currency, 'ILS')
from public.standalone_experiences se
where se.category_id = '06434e23-29f4-4c6b-ba63-b61e68879520'
  and not exists (
    select 1 from public.standalone_experience_price_variants v where v.experience_id = se.id
  );
