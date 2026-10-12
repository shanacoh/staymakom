-- Chantier Offre, étape 7 : le Plan de l'offre.
-- On définit d'abord ce qu'il FAUT avoir (les « must-haves »), mood par mood et région par région,
-- puis on cherche les partenaires. Trois tables, toutes réservées aux admins (rien n'est lisible
-- depuis le site public) :
--   offer_targets            l'objectif chiffré d'une case mood x région
--   offer_must_haves         la liste des must-haves et leur avancement
--   offer_must_have_regions  les régions candidates de chaque must-have (aucune = « à chercher »)
-- Pour revenir en arrière : supprimer les deux déclencheurs posés sur standalone_experiences et
-- experiences2, puis les trois tables et les fonctions de ce fichier. Aucune table existante n'est modifiée.

-- 1. Objectifs par mood et par région --------------------------------------------------------------
-- Une case sans ligne = objectif 0.
create table public.offer_targets (
  category_id uuid not null references public.categories (id) on delete cascade,
  region_id uuid not null references public.regions (id) on delete cascade,
  target integer not null check (target >= 0),
  updated_at timestamptz not null default now(),
  primary key (category_id, region_id)
);

comment on table public.offer_targets is 'Plan de l''offre : nombre d''expériences visé pour un mood dans une région. Pas de ligne = objectif 0.';

create trigger offer_targets_set_updated_at
  before update on public.offer_targets
  for each row execute function public.update_updated_at_column();

-- 2. Must-haves --------------------------------------------------------------------------------------
create table public.offer_must_haves (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  pillar text,
  name text not null check (btrim(name) <> ''),
  format text check (format in ('atelier', 'action', 'table', 'autonome', 'spectacle', 'degustation', 'guide', 'rencontre')),
  season text,
  car_free text not null default 'a_voir' check (car_free in ('oui', 'bus', 'non', 'selon_lieu', 'a_voir')),
  is_core boolean not null default false,
  status text not null default 'a_trouver' check (status in ('a_trouver', 'en_prospection', 'signe', 'en_ligne', 'abandonne')),
  partner text,
  notes text,
  standalone_experience_id uuid references public.standalone_experiences (id) on delete set null,
  experience2_id uuid references public.experiences2 (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Un must-have est couvert par une expérience seule OU une expérience hôtel, jamais les deux.
  constraint offer_must_haves_single_link check (standalone_experience_id is null or experience2_id is null)
);

comment on table public.offer_must_haves is 'Plan de l''offre : ce qu''il faut avoir au catalogue, mood par mood, avec l''avancement de la prospection.';
comment on column public.offer_must_haves.pillar is 'Pilier, texte court (ex. Judaïsme, Archéologie).';
comment on column public.offer_must_haves.car_free is 'Faisable sans voiture : oui, bus, non, selon_lieu, a_voir.';
comment on column public.offer_must_haves.is_core is 'Socle : fait partie du minimum à avoir.';
comment on column public.offer_must_haves.status is 'a_trouver, en_prospection, signe, en_ligne, abandonne. Passe tout seul à en_ligne quand l''expérience liée est publiée.';

create index offer_must_haves_category_id_idx on public.offer_must_haves (category_id);
create index offer_must_haves_status_idx on public.offer_must_haves (status);
-- Une expérience couvre au plus un must-have (le formulaire n'a qu'un champ « Must-have couvert »).
create unique index offer_must_haves_standalone_experience_key
  on public.offer_must_haves (standalone_experience_id) where standalone_experience_id is not null;
create unique index offer_must_haves_experience2_key
  on public.offer_must_haves (experience2_id) where experience2_id is not null;

create trigger offer_must_haves_set_updated_at
  before update on public.offer_must_haves
  for each row execute function public.update_updated_at_column();

-- 3. Régions candidates ------------------------------------------------------------------------------
create table public.offer_must_have_regions (
  must_have_id uuid not null references public.offer_must_haves (id) on delete cascade,
  region_id uuid not null references public.regions (id) on delete cascade,
  primary key (must_have_id, region_id)
);

comment on table public.offer_must_have_regions is 'Plan de l''offre : régions candidates d''un must-have. Aucune ligne = région « à chercher ».';

create index offer_must_have_regions_region_id_idx on public.offer_must_have_regions (region_id);

-- 4. Réservé aux admins ------------------------------------------------------------------------------
alter table public.offer_targets enable row level security;
alter table public.offer_must_haves enable row level security;
alter table public.offer_must_have_regions enable row level security;

create policy offer_targets_admin_all on public.offer_targets
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));
create policy offer_must_haves_admin_all on public.offer_must_haves
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));
create policy offer_must_have_regions_admin_all on public.offer_must_have_regions
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- Les visiteurs non connectés n'ont aucun droit sur ces tables.
revoke all on public.offer_targets, public.offer_must_haves, public.offer_must_have_regions from anon;
grant select, insert, update, delete on public.offer_targets, public.offer_must_haves, public.offer_must_have_regions to authenticated;

-- 5. Statut automatique « en ligne » -----------------------------------------------------------------
-- À chaque écriture d'un must-have, on regarde son expérience liée :
--   publiée                         -> le statut devient « en ligne »
--   liée mais pas (ou plus) publiée -> un statut « en ligne » redescend à « signé »
--   lien retiré                     -> un statut « en ligne » redescend à « signé »
-- Sans expérience liée, le statut choisi à la main est respecté tel quel.
create function public.offer_must_haves_sync_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_published boolean := false;
  v_linked boolean := new.standalone_experience_id is not null or new.experience2_id is not null;
  v_was_linked boolean := false;
begin
  if tg_op = 'UPDATE' then
    v_was_linked := old.standalone_experience_id is not null or old.experience2_id is not null;
  end if;

  if new.standalone_experience_id is not null then
    select s.status = 'published' into v_published
    from public.standalone_experiences s where s.id = new.standalone_experience_id;
  elsif new.experience2_id is not null then
    select e.status = 'published' into v_published
    from public.experiences2 e where e.id = new.experience2_id;
  end if;

  if coalesce(v_published, false) then
    new.status := 'en_ligne';
  elsif new.status = 'en_ligne' and (v_linked or v_was_linked) then
    new.status := 'signe';
  end if;
  return new;
end;
$$;

create trigger offer_must_haves_sync_status
  before insert or update on public.offer_must_haves
  for each row execute function public.offer_must_haves_sync_status();

-- Quand une expérience est publiée ou dépubliée, on « réveille » le must-have qu'elle couvre :
-- la fonction ci-dessus recalcule alors son statut.
create function public.offer_must_haves_follow_experience()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'standalone_experiences' then
    update public.offer_must_haves set updated_at = now() where standalone_experience_id = new.id;
  else
    update public.offer_must_haves set updated_at = now() where experience2_id = new.id;
  end if;
  return null;
end;
$$;

create trigger offer_must_haves_follow_standalone
  after update of status on public.standalone_experiences
  for each row
  when (old.status is distinct from new.status)
  execute function public.offer_must_haves_follow_experience();

create trigger offer_must_haves_follow_experience2
  after update of status on public.experiences2
  for each row
  when (old.status is distinct from new.status)
  execute function public.offer_must_haves_follow_experience();

revoke all on function public.offer_must_haves_sync_status() from public, anon, authenticated;
revoke all on function public.offer_must_haves_follow_experience() from public, anon, authenticated;

-- 6. Écritures en un seul geste ----------------------------------------------------------------------
-- Relier une expérience à un must-have (ou la détacher avec p_must_have_id = null). Tout se fait
-- dans la même opération : l'ancien lien de l'expérience est retiré, le nouveau est posé, et si le
-- must-have était couvert par une autre expérience, celle-ci est remplacée.
create function public.set_experience_must_have(p_kind text, p_experience_id uuid, p_must_have_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Réservé aux admins';
  end if;

  if p_kind = 'standalone' then
    update public.offer_must_haves set standalone_experience_id = null
    where standalone_experience_id = p_experience_id and id is distinct from p_must_have_id;
    if p_must_have_id is not null then
      update public.offer_must_haves
      set standalone_experience_id = p_experience_id, experience2_id = null
      where id = p_must_have_id;
      if not found then raise exception 'Must-have introuvable'; end if;
    end if;
  elsif p_kind = 'experience2' then
    update public.offer_must_haves set experience2_id = null
    where experience2_id = p_experience_id and id is distinct from p_must_have_id;
    if p_must_have_id is not null then
      update public.offer_must_haves
      set experience2_id = p_experience_id, standalone_experience_id = null
      where id = p_must_have_id;
      if not found then raise exception 'Must-have introuvable'; end if;
    end if;
  else
    raise exception 'Type d''expérience inconnu : %', p_kind;
  end if;
end;
$$;

-- Remplacer d'un coup les régions candidates d'un must-have (liste vide = « à chercher »).
create function public.set_must_have_regions(p_must_have_id uuid, p_region_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Réservé aux admins';
  end if;

  delete from public.offer_must_have_regions
  where must_have_id = p_must_have_id and not (region_id = any (coalesce(p_region_ids, '{}')));

  insert into public.offer_must_have_regions (must_have_id, region_id)
  select p_must_have_id, r from unnest(coalesce(p_region_ids, '{}')) as r
  on conflict do nothing;
end;
$$;

revoke all on function public.set_experience_must_have(text, uuid, uuid) from public, anon;
revoke all on function public.set_must_have_regions(uuid, uuid[]) from public, anon;
grant execute on function public.set_experience_must_have(text, uuid, uuid) to authenticated;
grant execute on function public.set_must_have_regions(uuid, uuid[]) to authenticated;
