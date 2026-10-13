-- Chantier Partenaires, étape 2 : l'espace partenaire (V0, expériences seules et bateaux).
--
-- Principe de sécurité : un partenaire n'a AUCUN accès direct aux tables. Les nouvelles tables sont
-- réservées aux admins, comme `providers`. Tout ce qu'un partenaire lit ou écrit passe par des
-- fonctions de la base (`partner_*`) qui vérifient qui il est, ne renvoient que les colonnes
-- permises et uniquement ce qui appartient à son prestataire. Marge, majoration, prix client, email
-- et téléphone des clients ne sortent d'aucune de ces fonctions.
--
-- Uniquement des AJOUTS : tables, colonnes, fonctions, déclencheurs. Aucune colonne existante n'est
-- supprimée, renommée ou modifiée. Rien ne touche au paiement ni à la confirmation d'une réservation.
-- Pour revenir en arrière : supprimer les fonctions `partner_*` et `admin_*partner*`, les trois
-- déclencheurs `partner_notify_*`, la règle de stockage, les 5 tables et les colonnes ajoutées.

-- 1. Tables ----------------------------------------------------------------------------------------

create table public.provider_users (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null,
  invited_at timestamptz not null default now(),
  invited_by uuid references auth.users (id) on delete set null,
  last_link_sent_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.provider_users is
  'Interne : quel utilisateur représente quel prestataire dans l''espace partenaire. Un prestataire peut avoir plusieurs utilisateurs, un utilisateur un seul prestataire.';
create index provider_users_provider_id_idx on public.provider_users (provider_id);

create table public.partner_terms_versions (
  version integer primary key,
  text_he text not null default '',
  text_en text not null default '',
  text_fr text not null default '',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.partner_terms_versions is
  'Interne : les versions des conditions partenaires (texte en he / en / fr). La version en vigueur est la plus haute publiée.';

create table public.partner_terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  version integer not null references public.partner_terms_versions (version),
  signer_name text not null,
  accepted_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);
comment on table public.partner_terms_acceptances is
  'Interne : preuve d''acceptation des conditions partenaires (version, date et heure, nom saisi, utilisateur, adresse IP, navigateur).';
create index partner_terms_acceptances_provider_id_idx on public.partner_terms_acceptances (provider_id);

create table public.partner_proposals (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  experience_id uuid references public.standalone_experiences (id) on delete cascade,
  proposal_type text not null,
  lang text not null default 'en',
  proposed jsonb not null,
  current jsonb not null default '{}'::jsonb,
  note text,
  status text not null default 'pending',
  admin_comment text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_experience_id uuid references public.standalone_experiences (id) on delete set null,
  constraint partner_proposals_type_check
    check (proposal_type in ('text', 'photos', 'price', 'practical_info', 'new_experience')),
  constraint partner_proposals_status_check check (status in ('pending', 'accepted', 'rejected')),
  constraint partner_proposals_lang_check check (lang in ('he', 'en', 'fr')),
  constraint partner_proposals_experience_check
    check ((proposal_type = 'new_experience') = (experience_id is null))
);
comment on table public.partner_proposals is
  'Interne : ce qu''un prestataire propose de changer (ou une nouvelle expérience). Rien n''arrive sur le site tant qu''un admin n''a pas accepté.';
create index partner_proposals_provider_id_idx on public.partner_proposals (provider_id);
create index partner_proposals_status_idx on public.partner_proposals (status);

create table public.partner_activity_log (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  experience_id uuid references public.standalone_experiences (id) on delete cascade,
  action text not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
comment on table public.partner_activity_log is
  'Interne : trace de ce qu''un prestataire applique directement (disponibilités, contact jour J, profil) : qui, quand, avant, après.';
create index partner_activity_log_provider_id_idx on public.partner_activity_log (provider_id, created_at desc);

-- Mêmes règles pour les cinq tables : seuls les admins lisent et écrivent. Un visiteur n'a aucun
-- droit, un partenaire connecté est arrêté par la règle (il passe par les fonctions plus bas).
do $$
declare
  t text;
begin
  foreach t in array array[
    'provider_users', 'partner_terms_versions', 'partner_terms_acceptances',
    'partner_proposals', 'partner_activity_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (has_role(auth.uid(), ''admin''::app_role)) with check (has_role(auth.uid(), ''admin''::app_role))',
      t || '_admin_all', t);
  end loop;
end $$;

create trigger partner_terms_versions_set_updated_at
  before update on public.partner_terms_versions
  for each row execute function public.update_updated_at_column();

-- Une version déjà acceptée par quelqu'un est une preuve : son texte ne se corrige plus, on publie
-- une nouvelle version.
create function public.partner_terms_versions_protect_accepted()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.text_he, new.text_en, new.text_fr, new.version) is distinct from (old.text_he, old.text_en, old.text_fr, old.version)
     and exists (select 1 from public.partner_terms_acceptances a where a.version = old.version) then
    raise exception 'terms_version_already_accepted';
  end if;
  return new;
end;
$$;

create trigger partner_terms_versions_protect_accepted
  before update on public.partner_terms_versions
  for each row execute function public.partner_terms_versions_protect_accepted();

insert into public.partner_terms_versions (version, text_he, text_en, text_fr, published_at)
values (1, 'À rédiger', 'À rédiger', 'À rédiger', now());

-- 2. Colonnes ajoutées -----------------------------------------------------------------------------

alter table public.standalone_bookings
  add column provider_notified_at timestamptz,
  add column provider_cancel_notified_at timestamptz,
  add column supplier_paid_at date,
  add column supplier_payment_reference text,
  add column special_requests text;
comment on column public.standalone_bookings.provider_notified_at is
  'Date d''envoi au prestataire de l''email « nouvelle réservation payée ». Vide = jamais envoyé. Empêche les doublons.';
comment on column public.standalone_bookings.provider_cancel_notified_at is
  'Date d''envoi au prestataire de l''email d''annulation. Vide = jamais envoyé.';
comment on column public.standalone_bookings.supplier_paid_at is
  'Date du règlement au prestataire, saisie par un admin (avec supplier_payment_status = paid).';
comment on column public.standalone_bookings.supplier_payment_reference is
  'Référence du règlement au prestataire (virement...), saisie par un admin.';
comment on column public.standalone_bookings.special_requests is
  'Demandes particulières du client, montrées au prestataire. Pas encore remplie par le checkout.';

alter table public.standalone_experience_internal
  add column supplier_price_changed_at timestamptz;
comment on column public.standalone_experience_internal.supplier_price_changed_at is
  'Posée quand une proposition de prix d''un prestataire est acceptée : « prix fournisseur modifié, vérifier le prix client ». Remise à vide par l''admin une fois vérifié.';

-- 3. Qui est ce partenaire ? ------------------------------------------------------------------------

-- Le prestataire de l'utilisateur connecté, ou rien. Un prestataire « arrêté » n'a plus d'accès.
create function public.current_partner_provider_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pu.provider_id
  from public.provider_users pu
  join public.providers p on p.id = pu.provider_id
  where pu.user_id = auth.uid() and p.status <> 'arrete'
$$;

create function public.partner_current_terms_version()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select max(version) from public.partner_terms_versions where published_at is not null
$$;

-- Porte d'entrée de toutes les fonctions partenaire : renvoie son prestataire, ou refuse.
-- Avec `p_terms`, refuse aussi tant que la version en vigueur des conditions n'est pas acceptée.
create function public.partner_require(p_terms boolean default true)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.current_partner_provider_id();
begin
  if v_provider is null then
    raise exception 'not_partner' using errcode = '42501';
  end if;
  if p_terms and not exists (
    select 1 from public.providers p
    where p.id = v_provider and p.terms_version = public.partner_current_terms_version()::text
  ) then
    raise exception 'terms_required' using errcode = '42501';
  end if;
  return v_provider;
end;
$$;

-- Vrai si l'expérience est celle de ce prestataire : prestataire principal, ou présent dans la
-- liste des prestataires (bateaux). `p_primary_only` : principal uniquement.
create function public.partner_owns_experience(p_provider uuid, p_experience uuid, p_primary_only boolean default false)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.standalone_experience_internal i
    where i.experience_id = p_experience and i.provider_id = p_provider
  ) or (not p_primary_only and exists (
    select 1 from public.standalone_experience_suppliers s
    where s.experience_id = p_experience and s.provider_id = p_provider
  ))
$$;

-- Nom de la colonne d'un texte dans une langue : title / title_fr / title_he.
create function public.partner_col(p_base text, p_lang text)
returns text
language sql
immutable
set search_path = public
as $$
  select p_base || case p_lang when 'fr' then '_fr' when 'he' then '_he' else '' end
$$;

-- Les champs qu'une proposition a le droit de porter, par type. Tout le reste est ignoré.
create function public.partner_proposal_keys(p_type text)
returns text[]
language sql
immutable
set search_path = public
as $$
  select case p_type
    when 'text' then array['title', 'subtitle', 'long_copy', 'duration']
    when 'practical_info' then array['meeting_point', 'address', 'access_note', 'know_before_you_go', 'contingency_note', 'arrive_minutes_before']
    when 'photos' then array['photos']
    when 'price' then array['supplier_price_adult', 'supplier_price_child']
    when 'new_experience' then array['title', 'description', 'duration', 'location', 'supplier_price_adult', 'supplier_price_child', 'photos']
    else array[]::text[]
  end
$$;

-- Ne garde d'une liste de photos que celles que CE prestataire a envoyées dans son dossier du
-- stockage : impossible de glisser l'adresse d'une image venue d'ailleurs.
create function public.partner_clean_photos(p_provider uuid, p_photos jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce(jsonb_agg(u), '[]'::jsonb)
  from (
    select distinct u
    from jsonb_array_elements_text(case when jsonb_typeof(p_photos) = 'array' then p_photos else '[]'::jsonb end) u
    where starts_with(u, 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public/experience-images/partner-proposals/' || p_provider || '/')
      and u !~ '[\s"<>]'
    limit 12
  ) s
$$;

create function public.partner_clean_price(p_value text)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case when p_value ~ '^\d{1,6}(\.\d{1,2})?$' then p_value::numeric end
$$;

-- 4. Session, profil, conditions -------------------------------------------------------------------

create function public.partner_session()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require(false);
  v_version integer := public.partner_current_terms_version();
  v_result jsonb;
begin
  update public.provider_users
  set last_login_at = now()
  where user_id = auth.uid() and (last_login_at is null or last_login_at < now() - interval '5 minutes');

  select jsonb_build_object(
    'provider', jsonb_build_object(
      'id', p.id, 'name', p.name, 'provider_type', p.provider_type, 'language', p.language,
      'contact_name', p.contact_name, 'email', p.email, 'whatsapp', p.whatsapp,
      'legal_name', p.legal_name, 'tax_id', p.tax_id, 'address', p.address,
      'day_contact_name', p.day_contact_name, 'day_contact_whatsapp', p.day_contact_whatsapp,
      'day_contact_language', p.day_contact_language),
    'user_email', (select pu.email from public.provider_users pu where pu.user_id = auth.uid()),
    'terms', jsonb_build_object(
      'current_version', v_version,
      'must_accept', p.terms_version is distinct from v_version::text,
      'accepted_version', p.terms_version,
      'accepted_at', p.terms_accepted_at,
      'signer_name', (select a.signer_name from public.partner_terms_acceptances a
                      where a.provider_id = p.id order by a.accepted_at desc limit 1),
      'text_he', t.text_he, 'text_en', t.text_en, 'text_fr', t.text_fr,
      'published_at', t.published_at))
  into v_result
  from public.providers p
  left join public.partner_terms_versions t on t.version = v_version
  where p.id = v_provider;

  return v_result;
end;
$$;

-- Son identité : appliquée directement (ce n'est pas du contenu publié). Seuls ces champs passent.
create function public.partner_update_profile(p_patch jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require(false);
  v_keys constant text[] := array['contact_name', 'whatsapp', 'legal_name', 'tax_id', 'address', 'language',
                                  'day_contact_name', 'day_contact_whatsapp', 'day_contact_language'];
  v_before jsonb;
  v_after jsonb;
begin
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    raise exception 'invalid_patch';
  end if;
  if (p_patch ? 'language' and coalesce(p_patch->>'language', '') not in ('he', 'en', 'fr'))
     or (p_patch ? 'day_contact_language' and coalesce(p_patch->>'day_contact_language', '') not in ('he', 'en', 'fr', '')) then
    raise exception 'invalid_language';
  end if;

  select to_jsonb(p) into v_before from public.providers p where p.id = v_provider for update;

  update public.providers p set
    contact_name = case when p_patch ? 'contact_name' then nullif(left(btrim(p_patch->>'contact_name'), 200), '') else p.contact_name end,
    whatsapp = case when p_patch ? 'whatsapp' then nullif(left(btrim(p_patch->>'whatsapp'), 40), '') else p.whatsapp end,
    legal_name = case when p_patch ? 'legal_name' then nullif(left(btrim(p_patch->>'legal_name'), 200), '') else p.legal_name end,
    tax_id = case when p_patch ? 'tax_id' then nullif(left(btrim(p_patch->>'tax_id'), 60), '') else p.tax_id end,
    address = case when p_patch ? 'address' then nullif(left(btrim(p_patch->>'address'), 400), '') else p.address end,
    language = case when p_patch ? 'language' then p_patch->>'language' else p.language end,
    day_contact_name = case when p_patch ? 'day_contact_name' then nullif(left(btrim(p_patch->>'day_contact_name'), 200), '') else p.day_contact_name end,
    day_contact_whatsapp = case when p_patch ? 'day_contact_whatsapp' then nullif(left(btrim(p_patch->>'day_contact_whatsapp'), 40), '') else p.day_contact_whatsapp end,
    day_contact_language = case when p_patch ? 'day_contact_language' then nullif(p_patch->>'day_contact_language', '') else p.day_contact_language end
  where p.id = v_provider;

  select to_jsonb(p) into v_after from public.providers p where p.id = v_provider;

  insert into public.partner_activity_log (provider_id, user_id, action, before, after)
  select v_provider, auth.uid(), 'profile',
         (select jsonb_object_agg(k, v_before->k) from unnest(v_keys) k where v_before->k is distinct from v_after->k),
         (select jsonb_object_agg(k, v_after->k) from unnest(v_keys) k where v_before->k is distinct from v_after->k)
  where exists (select 1 from unnest(v_keys) k where v_before->k is distinct from v_after->k);

  return public.partner_session();
end;
$$;

-- Acceptation des conditions : version, date et heure, nom saisi, utilisateur, adresse IP, navigateur.
create function public.partner_accept_terms(p_version integer, p_signer_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require(false);
  v_current integer := public.partner_current_terms_version();
  v_name text := left(btrim(coalesce(p_signer_name, '')), 200);
  v_headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  v_now timestamptz := now();
begin
  if v_current is null or p_version is distinct from v_current then
    raise exception 'terms_version_outdated';
  end if;
  if length(v_name) < 2 then
    raise exception 'signer_name_required';
  end if;

  insert into public.partner_terms_acceptances (provider_id, user_id, version, signer_name, accepted_at, ip_address, user_agent)
  values (v_provider, auth.uid(), v_current, v_name, v_now,
          nullif(btrim(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1)), ''),
          left(v_headers->>'user-agent', 500));

  update public.providers
  set terms_accepted_at = v_now, terms_version = v_current::text
  where id = v_provider;

  return public.partner_session();
end;
$$;

-- 5. Ses expériences -------------------------------------------------------------------------------

create function public.partner_experiences()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require();
  v_today text := (now() at time zone 'Asia/Jerusalem')::date::text;
begin
  return (
    select coalesce(jsonb_agg(x.item order by x.sort_title), '[]'::jsonb)
    from (
      select
        coalesce(e.title, e.title_fr, e.title_he, e.slug) as sort_title,
        jsonb_build_object(
          'id', e.id, 'slug', e.slug, 'status', e.status,
          'title', e.title, 'title_fr', e.title_fr, 'title_he', e.title_he,
          'image', coalesce(e.thumbnail_image, e.hero_image),
          'is_primary', i.provider_id is not distinct from v_provider,
          -- Questionnaire pratique à remplir : pas de point de rendez-vous, ou pas de contact jour J.
          'needs_questionnaire',
            coalesce(nullif(btrim(e.meeting_point), ''), nullif(btrim(e.meeting_point_fr), ''), nullif(btrim(e.meeting_point_he), '')) is null
            or (i.provider_id is not distinct from v_provider
                and coalesce(nullif(btrim(i.day_contact_name), ''), nullif(btrim(i.day_contact_phone), ''),
                             nullif(btrim(p.day_contact_name), ''), nullif(btrim(p.day_contact_whatsapp), '')) is null),
          -- Disponibilités à ouvrir : expérience publiée dont plus aucune date à venir n'est ouverte.
          'needs_availability',
            e.status = 'published' and i.provider_id is not distinct from v_provider and (
              case when e.availability_mode = 'whitelist' then
                not exists (
                  select 1 from jsonb_array_elements_text(
                    case when jsonb_typeof(e.whitelisted_dates) = 'array' then e.whitelisted_dates else '[]'::jsonb end) d
                  where d >= v_today)
              else
                jsonb_typeof(e.available_days) = 'array' and jsonb_array_length(e.available_days) = 0
              end)
        ) as item
      from public.standalone_experiences e
      left join public.standalone_experience_internal i on i.experience_id = e.id
      join public.providers p on p.id = v_provider
      where e.status <> 'archived' and public.partner_owns_experience(v_provider, e.id)
    ) x
  );
end;
$$;

-- Le détail d'une de ses expériences. Jamais la marge, la majoration ni le prix client.
create function public.partner_experience(p_experience_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require();
  v_primary boolean;
  v_result jsonb;
begin
  if not public.partner_owns_experience(v_provider, p_experience_id) then
    raise exception 'not_found' using errcode = '42501';
  end if;
  v_primary := public.partner_owns_experience(v_provider, p_experience_id, true);

  select jsonb_build_object(
    'id', e.id, 'slug', e.slug, 'status', e.status, 'is_primary', v_primary,
    'title', e.title, 'title_fr', e.title_fr, 'title_he', e.title_he,
    'subtitle', e.subtitle, 'subtitle_fr', e.subtitle_fr, 'subtitle_he', e.subtitle_he,
    'long_copy', e.long_copy, 'long_copy_fr', e.long_copy_fr, 'long_copy_he', e.long_copy_he,
    'duration', e.duration, 'duration_fr', e.duration_fr, 'duration_he', e.duration_he,
    'hero_image', e.hero_image, 'photos', coalesce(e.photos, '[]'::jsonb),
    'meeting_point', e.meeting_point, 'meeting_point_fr', e.meeting_point_fr, 'meeting_point_he', e.meeting_point_he,
    'address', e.address, 'address_fr', e.address_fr, 'address_he', e.address_he,
    'access_note', e.access_note, 'access_note_fr', e.access_note_fr, 'access_note_he', e.access_note_he,
    'know_before_you_go', e.know_before_you_go, 'know_before_you_go_fr', e.know_before_you_go_fr, 'know_before_you_go_he', e.know_before_you_go_he,
    'contingency_note', e.contingency_note, 'contingency_note_fr', e.contingency_note_fr, 'contingency_note_he', e.contingency_note_he,
    'arrive_minutes_before', e.arrive_minutes_before,
    'availability', jsonb_build_object(
      'availability_mode', coalesce(e.availability_mode, 'blacklist'),
      'available_days', coalesce(e.available_days, '[1,2,3,4,5,6,7]'::jsonb),
      'blocked_dates', coalesce(e.blocked_dates, '[]'::jsonb),
      'whitelisted_dates', coalesce(e.whitelisted_dates, '[]'::jsonb),
      'has_time_slots', coalesce(e.has_time_slots, false),
      'time_slots', coalesce(e.time_slots, '[]'::jsonb)),
    'day_contact', case when v_primary then jsonb_build_object(
      'name', i.day_contact_name, 'phone', i.day_contact_phone, 'language', i.day_contact_language) end,
    -- Son prix à lui : celui de la fiche s'il est le prestataire principal, sinon sa ligne dans la liste.
    'supplier_price', case
      when v_primary then jsonb_build_object('adult', i.supplier_price_adult, 'child', i.supplier_price_child)
      else (select jsonb_build_object('adult', s.price, 'child', null)
            from public.standalone_experience_suppliers s
            where s.experience_id = e.id and s.provider_id = v_provider
            order by s.sort_order limit 1)
    end,
    'currency', coalesce(e.currency, 'ILS'),
    'pending_proposals', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', pr.id, 'proposal_type', pr.proposal_type, 'lang', pr.lang, 'proposed', pr.proposed, 'created_at', pr.created_at)
        order by pr.created_at desc), '[]'::jsonb)
      from public.partner_proposals pr
      where pr.experience_id = e.id and pr.provider_id = v_provider and pr.status = 'pending')
  )
  into v_result
  from public.standalone_experiences e
  left join public.standalone_experience_internal i on i.experience_id = e.id
  where e.id = p_experience_id;

  return v_result;
end;
$$;

-- Contact du jour J de l'expérience : appliqué directement et tracé. Prestataire principal uniquement.
create function public.partner_set_day_contact(p_experience_id uuid, p_name text, p_phone text, p_language text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require();
  v_before jsonb;
  v_after jsonb;
begin
  if not public.partner_owns_experience(v_provider, p_experience_id, true) then
    raise exception 'not_found' using errcode = '42501';
  end if;
  if coalesce(p_language, '') not in ('he', 'en', 'fr', '') then
    raise exception 'invalid_language';
  end if;

  select jsonb_build_object('name', i.day_contact_name, 'phone', i.day_contact_phone, 'language', i.day_contact_language)
  into v_before
  from public.standalone_experience_internal i where i.experience_id = p_experience_id for update;

  update public.standalone_experience_internal
  set day_contact_name = nullif(left(btrim(coalesce(p_name, '')), 200), ''),
      day_contact_phone = nullif(left(btrim(coalesce(p_phone, '')), 40), ''),
      day_contact_language = nullif(p_language, '')
  where experience_id = p_experience_id
  returning jsonb_build_object('name', day_contact_name, 'phone', day_contact_phone, 'language', day_contact_language)
  into v_after;

  if v_before is distinct from v_after then
    insert into public.partner_activity_log (provider_id, user_id, experience_id, action, before, after)
    values (v_provider, auth.uid(), p_experience_id, 'day_contact', v_before, v_after);
  end if;
end;
$$;

-- Liste de dates propre (AAAA-MM-JJ), sans doublon, triée.
create function public.partner_clean_dates(p_dates jsonb)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select coalesce(jsonb_agg(d order by d), '[]'::jsonb)
  from (
    select distinct d
    from jsonb_array_elements_text(case when jsonb_typeof(p_dates) = 'array' then p_dates else '[]'::jsonb end) d
    where d ~ '^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$'
    limit 1100
  ) s
$$;

-- Disponibilités : il les gère seul, avec le même modèle que le back-office (jours ouverts, dates
-- fermées ou dates ouvertes, créneaux). Appliqué directement et tracé. Prestataire principal uniquement.
create function public.partner_set_availability(p_experience_id uuid, p_availability jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require();
  v_before jsonb;
  v_after jsonb;
  v_mode text := p_availability->>'availability_mode';
  v_days jsonb;
  v_slots jsonb;
  v_has_slots boolean;
begin
  if not public.partner_owns_experience(v_provider, p_experience_id, true) then
    raise exception 'not_found' using errcode = '42501';
  end if;
  if v_mode is null or v_mode not in ('whitelist', 'blacklist') then
    raise exception 'invalid_availability_mode';
  end if;

  select coalesce(jsonb_agg(n order by n), '[]'::jsonb) into v_days
  from (
    select distinct d::int as n
    from jsonb_array_elements_text(case when jsonb_typeof(p_availability->'available_days') = 'array' then p_availability->'available_days' else '[]'::jsonb end) d
    where d ~ '^[1-7]$'
  ) s;

  select coalesce(jsonb_agg(t order by t), '[]'::jsonb) into v_slots
  from (
    select distinct lpad(t, 5, '0') as t
    from jsonb_array_elements_text(case when jsonb_typeof(p_availability->'time_slots') = 'array' then p_availability->'time_slots' else '[]'::jsonb end) t
    where t ~ '^([01]?\d|2[0-3]):[0-5]\d$'
    limit 24
  ) s;
  v_has_slots := coalesce((p_availability->>'has_time_slots')::boolean, false) and jsonb_array_length(v_slots) > 0;

  select jsonb_build_object(
    'availability_mode', e.availability_mode, 'available_days', e.available_days, 'blocked_dates', e.blocked_dates,
    'whitelisted_dates', e.whitelisted_dates, 'has_time_slots', e.has_time_slots, 'time_slots', e.time_slots)
  into v_before
  from public.standalone_experiences e where e.id = p_experience_id for update;

  update public.standalone_experiences
  set availability_mode = v_mode,
      available_days = v_days,
      blocked_dates = public.partner_clean_dates(p_availability->'blocked_dates'),
      whitelisted_dates = public.partner_clean_dates(p_availability->'whitelisted_dates'),
      has_time_slots = v_has_slots,
      time_slots = case when v_has_slots then v_slots else '[]'::jsonb end
  where id = p_experience_id
  returning jsonb_build_object(
    'availability_mode', availability_mode, 'available_days', available_days, 'blocked_dates', blocked_dates,
    'whitelisted_dates', whitelisted_dates, 'has_time_slots', has_time_slots, 'time_slots', time_slots)
  into v_after;

  if v_before is distinct from v_after then
    insert into public.partner_activity_log (provider_id, user_id, experience_id, action, before, after)
    values (v_provider, auth.uid(), p_experience_id, 'availability', v_before, v_after);
  end if;

  return v_after;
end;
$$;

-- 6. Propositions ----------------------------------------------------------------------------------

-- Tout ce qui touche au contenu publié ou au prix devient une proposition. La valeur actuelle est
-- relue ici, côté base : le navigateur du partenaire ne peut pas la falsifier.
create function public.partner_submit_proposal(p_experience_id uuid, p_type text, p_proposed jsonb, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require();
  v_lang text;
  v_key text;
  v_text text;
  v_new jsonb;
  v_cur jsonb;
  v_clean jsonb := '{}'::jsonb;
  v_current jsonb := '{}'::jsonb;
  v_photos jsonb;
  v_price numeric;
  v_id uuid;
begin
  if p_proposed is null or jsonb_typeof(p_proposed) <> 'object' or cardinality(public.partner_proposal_keys(p_type)) = 0 then
    raise exception 'invalid_proposal';
  end if;
  if (select count(*) from public.partner_proposals where provider_id = v_provider and status = 'pending') >= 30 then
    raise exception 'too_many_pending_proposals';
  end if;

  if p_type = 'new_experience' then
    p_experience_id := null;
  elsif p_experience_id is null
     or not public.partner_owns_experience(v_provider, p_experience_id, p_type = 'price') then
    raise exception 'not_found' using errcode = '42501';
  end if;

  v_lang := case
    when p_proposed->>'lang' in ('he', 'en', 'fr') then p_proposed->>'lang'
    else coalesce((select p.language from public.providers p where p.id = v_provider and p.language in ('he', 'en', 'fr')), 'en')
  end;

  if p_type in ('text', 'practical_info') then
    foreach v_key in array public.partner_proposal_keys(p_type) loop
      continue when not (p_proposed ? v_key);
      if v_key = 'arrive_minutes_before' then
        continue when coalesce(p_proposed->>v_key, '') !~ '^\d{1,3}$';
        v_new := to_jsonb((p_proposed->>v_key)::int);
        select to_jsonb(e.arrive_minutes_before) into v_cur from public.standalone_experiences e where e.id = p_experience_id;
      else
        v_text := left(btrim(coalesce(p_proposed->>v_key, '')), 8000);
        continue when v_key = 'title' and v_text = '';
        v_new := to_jsonb(v_text);
        execute format('select to_jsonb(coalesce(btrim(e.%I), '''')) from public.standalone_experiences e where e.id = $1',
                       public.partner_col(v_key, v_lang))
          into v_cur using p_experience_id;
      end if;
      -- Seuls les champs réellement changés font partie de la proposition.
      if v_new is distinct from v_cur then
        v_clean := v_clean || jsonb_build_object(v_key, v_new);
        v_current := v_current || jsonb_build_object(v_key, v_cur);
      end if;
    end loop;

  elsif p_type = 'photos' then
    v_photos := public.partner_clean_photos(v_provider, p_proposed->'photos');
    if jsonb_array_length(v_photos) > 0 then
      v_clean := jsonb_build_object('photos', v_photos);
      select jsonb_build_object('photos', coalesce(e.photos, '[]'::jsonb)) into v_current
      from public.standalone_experiences e where e.id = p_experience_id;
    end if;

  elsif p_type = 'price' then
    select jsonb_build_object('supplier_price_adult', i.supplier_price_adult, 'supplier_price_child', i.supplier_price_child)
    into v_current
    from public.standalone_experience_internal i where i.experience_id = p_experience_id;
    foreach v_key in array public.partner_proposal_keys(p_type) loop
      v_price := public.partner_clean_price(p_proposed->>v_key);
      continue when v_price is null or (v_key = 'supplier_price_adult' and v_price <= 0);
      if to_jsonb(v_price) is distinct from v_current->v_key then
        v_clean := v_clean || jsonb_build_object(v_key, v_price);
      end if;
    end loop;

  else -- new_experience
    foreach v_key in array array['title', 'description', 'duration', 'location'] loop
      v_text := left(btrim(coalesce(p_proposed->>v_key, '')), 8000);
      if v_text <> '' then
        v_clean := v_clean || jsonb_build_object(v_key, v_text);
      end if;
    end loop;
    if not (v_clean ? 'title') then
      raise exception 'title_required';
    end if;
    foreach v_key in array array['supplier_price_adult', 'supplier_price_child'] loop
      v_price := public.partner_clean_price(p_proposed->>v_key);
      if v_price is not null then
        v_clean := v_clean || jsonb_build_object(v_key, v_price);
      end if;
    end loop;
    v_photos := public.partner_clean_photos(v_provider, p_proposed->'photos');
    if jsonb_array_length(v_photos) > 0 then
      v_clean := v_clean || jsonb_build_object('photos', v_photos);
    end if;
  end if;

  if v_clean = '{}'::jsonb then
    raise exception 'no_change';
  end if;

  insert into public.partner_proposals (provider_id, experience_id, proposal_type, lang, proposed, current, note, created_by)
  values (v_provider, p_experience_id, p_type, v_lang, v_clean, coalesce(v_current, '{}'::jsonb),
          nullif(left(btrim(coalesce(p_note, '')), 2000), ''), auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

create function public.partner_proposals()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require();
begin
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', pr.id, 'experience_id', pr.experience_id,
      'experience_title', e.title, 'experience_title_fr', e.title_fr, 'experience_title_he', e.title_he,
      'proposal_type', pr.proposal_type, 'lang', pr.lang, 'proposed', pr.proposed, 'current', pr.current,
      'note', pr.note, 'status', pr.status, 'admin_comment', pr.admin_comment,
      'created_at', pr.created_at, 'reviewed_at', pr.reviewed_at)
      order by pr.created_at desc), '[]'::jsonb)
    from public.partner_proposals pr
    left join public.standalone_experiences e on e.id = pr.experience_id
    where pr.provider_id = v_provider
  );
end;
$$;

-- 7. Réservations, revenus, avis, utilisateurs -----------------------------------------------------

-- Uniquement les réservations payées (paid ou deposit_paid) et non annulées de ce prestataire.
-- Du client : prénom et initiale du nom, langue, demandes particulières. Rien d'autre.
-- Le montant est celui qui revient au prestataire, jamais le prix payé par le client.
create function public.partner_bookings_of(v_provider uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return (
    select coalesce(jsonb_agg(x.item order by x.booking_date desc, x.time_slot desc nulls last), '[]'::jsonb)
    from (
      select
        b.booking_date, b.time_slot,
        jsonb_build_object(
          'id', b.id,
          'ref', 'SM-' || upper(left(b.id::text, 8)),
          'experience_id', b.standalone_experience_id,
          'experience_title', coalesce(e.title, b.custom_experience_title),
          'experience_title_fr', coalesce(e.title_fr, e.title, b.custom_experience_title),
          'experience_title_he', coalesce(e.title_he, e.title, b.custom_experience_title),
          'booking_date', b.booking_date,
          'time_slot', b.time_slot,
          'party_size', b.party_size,
          'adults', coalesce(b.adults_count, b.party_size),
          'children', coalesce(b.children_count, 0),
          'customer_first_name', split_part(btrim(b.customer_name), ' ', 1),
          'customer_last_initial', case
            when btrim(b.customer_name) like '% %'
              then upper(left(split_part(btrim(b.customer_name), ' ', array_length(string_to_array(btrim(b.customer_name), ' '), 1)), 1))
          end,
          'customer_language', b.preferred_lang,
          'special_requests', nullif(btrim(b.special_requests), ''),
          -- Ce qui lui revient : le coût fournisseur saisi sur la réservation s'il existe, sinon
          -- prix fournisseur de la fiche × participants. Vide si rien ne permet de le calculer.
          'provider_amount', coalesce(
            b.supplier_cost,
            case when b.product_type <> 'boat' and i.provider_id = v_provider and coalesce(i.supplier_price_adult, 0) > 0 then
              coalesce(b.adults_count, b.party_size) * i.supplier_price_adult
              + coalesce(b.children_count, 0) * coalesce(i.supplier_price_child, i.supplier_price_adult)
            end),
          'currency', case when b.supplier_cost is not null then coalesce(b.currency, 'ILS') else coalesce(e.currency, 'ILS') end,
          'settled', b.supplier_payment_status = 'paid',
          'settled_at', case when b.supplier_payment_status = 'paid' then b.supplier_paid_at end,
          'settlement_reference', case when b.supplier_payment_status = 'paid' then b.supplier_payment_reference end
        ) as item
      from public.standalone_bookings b
      left join public.standalone_experiences e on e.id = b.standalone_experience_id
      left join public.standalone_experience_internal i on i.experience_id = b.standalone_experience_id
      where b.payment_status in ('paid', 'deposit_paid')
        and b.status <> 'cancelled' and not coalesce(b.is_cancelled, false)
        and (b.provider_id = v_provider or (b.provider_id is null and i.provider_id = v_provider))
    ) x
  );
end;
$$;

-- Ce que le partenaire appelle : ses réservations à lui, et seulement une fois les conditions acceptées.
create function public.partner_bookings()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public.partner_bookings_of(public.partner_require())
$$;

-- Les avis publiés sur ses expériences. Ni email ni téléphone du client.
create function public.partner_reviews()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require();
begin
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id,
      'experience_title', e.title, 'experience_title_fr', e.title_fr, 'experience_title_he', e.title_he,
      'customer_first_name', r.customer_first_name, 'customer_last_initial', r.customer_last_initial,
      'rating', r.rating, 'comment', r.comment, 'lang', r.lang,
      'review_date', coalesce(r.review_date, r.created_at::date),
      'staff_reply', r.staff_reply)
      order by coalesce(r.review_date, r.created_at::date) desc), '[]'::jsonb)
    from public.reviews r
    left join public.standalone_experiences e on e.id = r.standalone_experience_id
    left join public.standalone_experience_internal i on i.experience_id = r.standalone_experience_id
    where r.moderation_status = 'published'
      and (r.provider_id = v_provider or (r.provider_id is null and i.provider_id = v_provider))
  );
end;
$$;

create function public.partner_users()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require();
begin
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'email', pu.email, 'last_login_at', pu.last_login_at, 'is_me', pu.user_id = auth.uid())
      order by pu.created_at), '[]'::jsonb)
    from public.provider_users pu
    where pu.provider_id = v_provider
  );
end;
$$;

-- 8. Côté admin ------------------------------------------------------------------------------------

-- Retrouve un compte par son email (la fonction serveur d'invitation en a besoin pour ne pas créer
-- un deuxième compte à quelqu'un qui en a déjà un). Clé de service uniquement.
create function public.admin_find_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id from auth.users u where lower(u.email) = lower(btrim(p_email)) limit 1
$$;

-- Relie un utilisateur à un prestataire et lui donne le rôle partenaire, en une seule opération.
-- Appelée par la fonction serveur d'invitation (clé de service) après vérification de l'admin.
create function public.admin_link_partner_user(p_provider_id uuid, p_user_id uuid, p_email text, p_invited_by uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
begin
  select r.role into v_role from public.user_roles r where r.user_id = p_user_id for update;
  if v_role in ('admin', 'hotel_admin') then
    raise exception 'role_conflict';
  end if;
  if exists (select 1 from public.provider_users pu where pu.user_id = p_user_id and pu.provider_id <> p_provider_id) then
    raise exception 'already_linked_to_another_provider';
  end if;

  insert into public.user_roles (user_id, role) values (p_user_id, 'partner')
  on conflict (user_id) do update set role = 'partner';

  insert into public.provider_users (provider_id, user_id, email, invited_by)
  values (p_provider_id, p_user_id, lower(btrim(p_email)), p_invited_by)
  on conflict (user_id) do update
    set email = excluded.email, invited_at = now(), invited_by = excluded.invited_by;

  -- Un compte tout juste créé pour l'invitation a fait naître une fiche « lead » automatique :
  -- un prestataire n'est pas un prospect client, on la retire.
  delete from public.leads l
  where l.converted_user_id = p_user_id and l.source = 'account' and l.created_at > now() - interval '2 minutes';
end;
$$;

-- Accepter ou refuser une proposition. Accepter applique la modification dans la même opération :
-- textes et infos pratiques sur la fiche (dans la langue de la proposition), photos ajoutées à la
-- galerie, prix fournisseur seul (le prix client n'est jamais touché : un signal est posé sur la
-- fiche), nouvelle expérience créée en BROUILLON, jamais publiée.
create function public.admin_review_partner_proposal(p_id uuid, p_decision text, p_comment text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.partner_proposals;
  v_key text;
  v_text text;
  v_new_id uuid;
  v_slug text;
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'admin_only' using errcode = '42501';
  end if;
  if p_decision not in ('accepted', 'rejected') then
    raise exception 'invalid_decision';
  end if;

  select * into r from public.partner_proposals where id = p_id for update;
  if not found then
    raise exception 'not_found';
  end if;
  if r.status <> 'pending' then
    raise exception 'already_reviewed';
  end if;

  if p_decision = 'accepted' then
    if r.proposal_type in ('text', 'practical_info') then
      foreach v_key in array public.partner_proposal_keys(r.proposal_type) loop
        continue when not (r.proposed ? v_key);
        if v_key = 'arrive_minutes_before' then
          update public.standalone_experiences
          set arrive_minutes_before = (r.proposed->>v_key)::int
          where id = r.experience_id;
        else
          execute format('update public.standalone_experiences set %I = nullif($1, '''') where id = $2',
                         public.partner_col(v_key, r.lang))
            using r.proposed->>v_key, r.experience_id;
        end if;
      end loop;

    elsif r.proposal_type = 'photos' then
      update public.standalone_experiences e
      set photos = (
            select coalesce(jsonb_agg(u), '[]'::jsonb)
            from (
              select u, min(ord) as first_ord
              from jsonb_array_elements_text(
                (case when jsonb_typeof(e.photos) = 'array' then e.photos else '[]'::jsonb end) || (r.proposed->'photos')
              ) with ordinality as t(u, ord)
              group by u
              order by first_ord
            ) s),
          hero_image = coalesce(nullif(e.hero_image, ''), r.proposed->'photos'->>0)
      where e.id = r.experience_id;

    elsif r.proposal_type = 'price' then
      update public.standalone_experience_internal i
      set supplier_price_adult = coalesce((r.proposed->>'supplier_price_adult')::numeric, i.supplier_price_adult),
          supplier_price_child = coalesce((r.proposed->>'supplier_price_child')::numeric, i.supplier_price_child),
          supplier_price_changed_at = now()
      where i.experience_id = r.experience_id;

    else -- new_experience : une fiche en brouillon, reliée au prestataire
      v_new_id := gen_random_uuid();
      v_text := r.proposed->>'title';
      v_slug := btrim(regexp_replace(lower(v_text), '[^a-z0-9]+', '-', 'g'), '-');
      v_slug := 'proposition-' || case when v_slug = '' then 'partenaire' else left(v_slug, 60) end || '-' || left(v_new_id::text, 6);

      insert into public.standalone_experiences (id, slug, status, title, long_copy, duration, address, photos, hero_image)
      values (v_new_id, v_slug, 'draft', v_text, r.proposed->>'description', r.proposed->>'duration',
              r.proposed->>'location', coalesce(r.proposed->'photos', '[]'::jsonb), r.proposed->'photos'->>0);

      if r.lang <> 'en' then
        execute format(
          'update public.standalone_experiences set %I = $1, %I = $2, %I = $3, %I = $4 where id = $5',
          public.partner_col('title', r.lang), public.partner_col('long_copy', r.lang),
          public.partner_col('duration', r.lang), public.partner_col('address', r.lang))
          using v_text, r.proposed->>'description', r.proposed->>'duration', r.proposed->>'location', v_new_id;
      end if;

      insert into public.standalone_experience_internal (experience_id, provider_id, supplier_price_adult, supplier_price_child)
      values (v_new_id, r.provider_id,
              coalesce((r.proposed->>'supplier_price_adult')::numeric, 0),
              (r.proposed->>'supplier_price_child')::numeric)
      on conflict (experience_id) do update
        set provider_id = excluded.provider_id,
            supplier_price_adult = excluded.supplier_price_adult,
            supplier_price_child = excluded.supplier_price_child;
    end if;
  end if;

  update public.partner_proposals
  set status = p_decision,
      admin_comment = nullif(btrim(coalesce(p_comment, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      created_experience_id = v_new_id
  where id = p_id;

  return jsonb_build_object('status', p_decision, 'created_experience_id', v_new_id);
end;
$$;

-- Règlements d'un prestataire, vus du back-office : exactement la liste et les montants que le
-- prestataire voit dans son espace (même calcul), pour y saisir « réglé le... / référence ».
create function public.admin_provider_settlements(p_provider_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'admin_only' using errcode = '42501';
  end if;
  return public.partner_bookings_of(p_provider_id);
end;
$$;

-- Publier une nouvelle version des conditions : chaque prestataire devra l'accepter à sa prochaine connexion.
create function public.admin_publish_partner_terms(p_text_he text, p_text_en text, p_text_fr text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_version integer;
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'admin_only' using errcode = '42501';
  end if;
  lock table public.partner_terms_versions in share row exclusive mode;
  select coalesce(max(version), 0) + 1 into v_version from public.partner_terms_versions;
  insert into public.partner_terms_versions (version, text_he, text_en, text_fr, published_at)
  values (v_version, coalesce(p_text_he, ''), coalesce(p_text_en, ''), coalesce(p_text_fr, ''), now());
  return v_version;
end;
$$;

-- 9. Notifications ---------------------------------------------------------------------------------
-- La base prévient la fonction serveur `partner-notify`, qui envoie l'email. L'appel part après
-- l'enregistrement et ne peut jamais le bloquer : la moindre erreur est avalée ici.
create function public.partner_notify(p_event text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform net.http_post(
    url := 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/functions/v1/partner-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_cron_secret')
    ),
    body := jsonb_build_object('event', p_event, 'id', p_id),
    timeout_milliseconds := 20000
  );
exception when others then
  raise warning 'partner_notify(%) : %', p_event, sqlerrm;
end;
$$;

create function public.partner_notify_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.partner_notify(tg_argv[0], new.id);
  return null;
end;
$$;

create trigger partner_notify_proposal_created
  after insert on public.partner_proposals
  for each row execute function public.partner_notify_trigger('proposal_created');

create trigger partner_notify_terms_accepted
  after insert on public.partner_terms_acceptances
  for each row execute function public.partner_notify_trigger('terms_accepted');

-- Annulation : seulement pour une réservation dont le prestataire avait été prévenu, une seule fois.
-- La condition est dans le déclencheur lui-même : pour toute autre écriture sur une réservation
-- (paiement, confirmation...), rien ne s'exécute.
create trigger partner_notify_booking_cancelled
  after update of status, is_cancelled on public.standalone_bookings
  for each row
  when (
    (new.status = 'cancelled' or coalesce(new.is_cancelled, false))
    and not (old.status = 'cancelled' or coalesce(old.is_cancelled, false))
    and new.provider_notified_at is not null
    and new.provider_cancel_notified_at is null
  )
  execute function public.partner_notify_trigger('booking_cancelled');

-- 10. Photos : un partenaire n'envoie que dans son propre dossier ----------------------------------
create policy "Partners can upload proposal photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'experience-images'
    and (storage.foldername(name))[1] = 'partner-proposals'
    and (storage.foldername(name))[2] = public.current_partner_provider_id()::text
  );

-- 11. Qui peut appeler quoi ------------------------------------------------------------------------
-- Par défaut une nouvelle fonction est appelable par tout le monde : on retire tout, puis on
-- n'ouvre que ce qu'il faut. Un visiteur non connecté n'a accès à aucune de ces fonctions.
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as signature, p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.proname like 'partner\_%' or p.proname in (
        'current_partner_provider_id', 'admin_find_user_id_by_email', 'admin_link_partner_user',
        'admin_review_partner_proposal', 'admin_publish_partner_terms', 'admin_provider_settlements'))
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.signature);
    execute format('grant execute on function %s to service_role', f.signature);
    if f.proname in (
      'partner_session', 'partner_update_profile', 'partner_accept_terms', 'partner_experiences', 'partner_experience',
      'partner_set_day_contact', 'partner_set_availability', 'partner_submit_proposal', 'partner_proposals',
      'partner_bookings', 'partner_reviews', 'partner_users',
      'current_partner_provider_id', 'admin_review_partner_proposal', 'admin_publish_partner_terms',
      'admin_provider_settlements'
    ) then
      execute format('grant execute on function %s to authenticated', f.signature);
    end if;
  end loop;
end $$;
