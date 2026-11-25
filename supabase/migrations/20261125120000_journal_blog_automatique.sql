-- Blog automatique du Journal (25/11/2026)
-- 1. Les articles deviennent « une langue par article » (en / he / fr), avec un circuit
--    éditorial (brouillon, programmé, publié, rejeté, bloqué). Les 12 articles existants
--    restent tels quels (anglais + hébreu dans les colonnes _en / _he, statut « publié »).
-- 2. File de sujets (blog_topics), réglages (journal_settings), liens « Rejeter » à usage
--    unique (journal_action_tokens), journal des générations (journal_generation_runs).
-- 3. Publication à l'heure prévue + notification IndexNow (Bing), tout côté serveur.

begin;

-- ---------------------------------------------------------------------------
-- 1. Articles
-- ---------------------------------------------------------------------------
-- Les nouveaux articles rangent leur texte dans des colonnes sans langue (title, intro...) :
-- les colonnes _en ne sont donc plus obligatoires. Elles restent vides pour eux, ce qui les
-- exclut aussi de la traduction automatique espagnol / russe / allemand (jamais traduits).
alter table public.journal_posts alter column title_en drop not null;
alter table public.journal_posts alter column content_en drop not null;

alter table public.journal_posts
  add column if not exists lang text not null default 'en',
  add column if not exists topic_group text,
  add column if not exists pipeline_status text not null default 'draft',
  add column if not exists scheduled_at timestamptz,
  add column if not exists generated_at timestamptz,
  add column if not exists title text,
  add column if not exists seo_title text,
  add column if not exists meta_description text,
  add column if not exists intro text,
  add column if not exists body jsonb,
  add column if not exists booking_intro text,
  add column if not exists conclusion text,
  add column if not exists faq jsonb,
  add column if not exists cover_alt text,
  add column if not exists primary_keyword text,
  add column if not exists secondary_keywords text[] not null default '{}',
  add column if not exists linked_listings jsonb not null default '[]'::jsonb,
  add column if not exists internal_links text[] not null default '{}',
  add column if not exists to_verify text[] not null default '{}',
  add column if not exists block_reason text,
  add column if not exists topic_id uuid,
  add column if not exists generation_meta jsonb;

-- Articles existants : leur statut éditorial suit leur statut actuel.
update public.journal_posts set pipeline_status = 'published' where status = 'published';
update public.journal_posts set pipeline_status = 'draft' where status <> 'published';

alter table public.journal_posts
  add constraint journal_posts_lang_check check (lang in ('en', 'he', 'fr')),
  add constraint journal_posts_pipeline_status_check
    check (pipeline_status in ('draft', 'scheduled', 'published', 'rejected', 'blocked')),
  add constraint journal_posts_seo_title_len check (seo_title is null or char_length(seo_title) <= 60),
  add constraint journal_posts_meta_description_len check (meta_description is null or char_length(meta_description) <= 155),
  -- Un article est visible sur le site si et seulement si son statut éditorial est « publié ».
  add constraint journal_posts_status_consistent check ((status = 'published') = (pipeline_status = 'published')),
  add constraint journal_posts_scheduled_has_date check (pipeline_status <> 'scheduled' or scheduled_at is not null);

-- Jamais deux articles programmés / publiés sur le même mot-clé dans la même langue.
create unique index if not exists journal_posts_unique_keyword_live
  on public.journal_posts (lang, lower(primary_keyword))
  where primary_keyword is not null and pipeline_status in ('scheduled', 'published');
create index if not exists journal_posts_due_idx on public.journal_posts (scheduled_at) where pipeline_status = 'scheduled';
create index if not exists journal_posts_topic_group_idx on public.journal_posts (topic_group) where topic_group is not null;

-- Synchronise les deux statuts : « status » (ancien, lu par tout le site) et « pipeline_status »
-- (circuit éditorial). L'ancien éditeur du back-office change « status » ; le nouveau circuit
-- change « pipeline_status ». Dans les deux cas l'autre suit, dans la même écriture.
create or replace function public.journal_posts_sync_status()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  old_status text := case when tg_op = 'UPDATE' then old.status::text else 'draft' end;
  old_pipeline text := case when tg_op = 'UPDATE' then old.pipeline_status else 'draft' end;
begin
  if new.status::text is distinct from old_status and new.pipeline_status is not distinct from old_pipeline then
    -- Changement fait par l'ancien éditeur (publier / dépublier).
    if new.status = 'published' then
      new.pipeline_status := 'published';
    elsif old_pipeline = 'published' then
      new.pipeline_status := 'draft';
    end if;
  end if;

  if new.pipeline_status = 'published' then
    new.status := 'published';
    new.published_at := coalesce(new.published_at, now());
  elsif new.status = 'published' then
    new.status := 'draft';
  end if;

  if new.pipeline_status <> 'scheduled' then
    new.scheduled_at := case when new.pipeline_status = 'published' then new.scheduled_at else null end;
  end if;
  return new;
end;
$$;

drop trigger if exists journal_posts_sync_status on public.journal_posts;
create trigger journal_posts_sync_status
  before insert or update on public.journal_posts
  for each row execute function public.journal_posts_sync_status();

-- Lecture publique : seulement les articles réellement publiés.
drop policy if exists "Anyone can view published articles" on public.journal_posts;
create policy "Anyone can view published articles" on public.journal_posts
  for select
  using (status = 'published'::hotel_status and pipeline_status = 'published' and published_at is not null);

-- ---------------------------------------------------------------------------
-- 2. File de sujets
-- ---------------------------------------------------------------------------
create table if not exists public.blog_topics (
  id uuid primary key default gen_random_uuid(),
  lang text not null check (lang in ('en', 'he', 'fr')),
  primary_keyword text not null,
  monthly_volume integer,
  difficulty integer check (difficulty is null or difficulty between 0 and 100),
  topic_type text not null check (topic_type in ('pilier', 'guide', 'saisonnier', 'cluster')),
  working_title text not null,
  angle text,
  -- Ce que l'article doit relier : régions (slug de la table regions), moods (slug de
  -- categories), villes (texte libre) et la note d'origine « À lier ».
  link_regions text[] not null default '{}',
  link_moods text[] not null default '{}',
  link_cities text[] not null default '{}',
  link_note text,
  desired_date date,
  priority integer not null default 100,
  status text not null default 'a_faire' check (status in ('a_faire', 'genere', 'publie', 'ecarte')),
  topic_group text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists blog_topics_unique_keyword on public.blog_topics (lang, lower(primary_keyword));
create index if not exists blog_topics_queue_idx on public.blog_topics (status, lang, priority);

alter table public.journal_posts
  add constraint journal_posts_topic_fk foreign key (topic_id) references public.blog_topics (id) on delete set null;

drop trigger if exists update_blog_topics_updated_at on public.blog_topics;
create trigger update_blog_topics_updated_at before update on public.blog_topics
  for each row execute function public.update_updated_at_column();

alter table public.blog_topics enable row level security;
drop policy if exists "Admins manage blog topics" on public.blog_topics;
create policy "Admins manage blog topics" on public.blog_topics
  for all using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));

-- Le sujet suit son article : publié → sujet « publié ».
create or replace function public.journal_posts_sync_topic()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.topic_id is not null and new.pipeline_status = 'published'
     and (tg_op = 'INSERT' or old.pipeline_status is distinct from 'published') then
    update public.blog_topics set status = 'publie' where id = new.topic_id and status <> 'publie';
  end if;
  return null;
end;
$$;
drop trigger if exists journal_posts_sync_topic on public.journal_posts;
create trigger journal_posts_sync_topic
  after insert or update of pipeline_status on public.journal_posts
  for each row execute function public.journal_posts_sync_topic();

-- ---------------------------------------------------------------------------
-- 3. Réglages (une seule ligne)
-- ---------------------------------------------------------------------------
create table if not exists public.journal_settings (
  id boolean primary key default true check (id),
  auto_publish boolean not null default true,
  publish_hour integer not null default 17 check (publish_hour between 0 and 23),
  -- Les premiers articles générés attendent une validation manuelle (calibrage du ton).
  manual_review_remaining integer not null default 3 check (manual_review_remaining >= 0),
  forbidden_words jsonb not null default '{}'::jsonb,
  -- Variantes de noms de prestataires à bloquer en plus de la table providers.
  provider_aliases text[] not null default '{}',
  -- Noms de prestataires qui sont aussi des sites publics (autorisés dans un article).
  provider_allowlist text[] not null default '{}',
  notify_email text not null default 'shana@staymakom.com',
  indexnow_key text,
  updated_at timestamptz not null default now()
);
drop trigger if exists update_journal_settings_updated_at on public.journal_settings;
create trigger update_journal_settings_updated_at before update on public.journal_settings
  for each row execute function public.update_updated_at_column();

alter table public.journal_settings enable row level security;
drop policy if exists "Admins manage journal settings" on public.journal_settings;
create policy "Admins manage journal settings" on public.journal_settings
  for all using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));

insert into public.journal_settings (id, forbidden_words, provider_aliases, provider_allowlist, indexnow_key)
values (
  true,
  jsonb_build_object(
    'en', jsonb_build_array('war', 'wars', 'wartime', 'missile', 'missiles', 'rocket', 'rockets', 'terror', 'terrorist',
      'terrorists', 'terrorism', 'attack', 'attacks', 'hostage', 'hostages', 'IDF', 'army', 'soldier', 'soldiers',
      'military', 'conflict', 'Hamas', 'Hezbollah', 'Iran', 'Gaza', 'ceasefire', 'siren', 'sirens', 'bomb shelter',
      'security situation', 'security', 'occupation', 'settlement', 'settlements', 'West Bank', 'politics', 'political',
      'election', 'elections', 'Netanyahu', 'government', 'protest', 'protests', 'airstrike', 'airstrikes',
      'travel advisory', 'October 7'),
    'fr', jsonb_build_array('guerre', 'guerres', 'missile', 'missiles', 'roquette', 'roquettes', 'terrorisme', 'terroriste',
      'terroristes', 'attentat', 'attentats', 'otage', 'otages', 'Tsahal', 'armée', 'soldat', 'soldats', 'militaire',
      'militaires', 'conflit', 'Hamas', 'Hezbollah', 'Iran', 'Gaza', 'cessez-le-feu', 'sirène', 'sirènes',
      'abri anti-aérien', 'situation sécuritaire', 'sécuritaire', 'Cisjordanie', 'colonies israéliennes',
      'situation politique', 'élection', 'élections', 'Netanyahou', 'gouvernement israélien', 'manifestation',
      'manifestations', 'frappe aérienne', 'frappes', '7 octobre'),
    'he', jsonb_build_array('מלחמה', 'מלחמת', 'טיל', 'טילים', 'רקטה', 'רקטות', 'טרור', 'מחבל', 'מחבלים', 'פיגוע', 'פיגועים',
      'חטופים', 'חטוף', 'צה"ל', 'צבא', 'חייל', 'חיילים', 'צבאי', 'סכסוך', 'חמאס', 'חיזבאללה', 'איראן', 'עזה',
      'הפסקת אש', 'אזעקה', 'אזעקות', 'מקלט', 'ממ"ד', 'מצב ביטחוני', 'ביטחוני', 'התנחלות', 'התנחלויות', 'בחירות',
      'נתניהו', 'ממשלה', 'הפגנה', 'הפגנות', '7 באוקטובר', 'שבעה באוקטובר')
  ),
  array['Galita', 'Tishbi', 'Cooking Studio', 'The Cooking Studio', 'Na Laga''at', 'Nalagaat', 'Lev Hateva',
        'Dolphin Reef', 'M&H', 'Time Elevator', 'גליתה', 'טישבי', 'דולפין ריף', 'נא לגעת', 'דולפינריף'],
  array['City of David'],
  '6f1e2b9c4d8a47e3b5c0a9d2e7f41c86'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Liens « Rejeter » de l'email (usage unique, 24 h) et journal des générations
-- ---------------------------------------------------------------------------
create table if not exists public.journal_action_tokens (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.journal_posts (id) on delete cascade,
  action text not null check (action in ('reject')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.journal_action_tokens enable row level security; -- clé de service uniquement

create table if not exists public.journal_generation_runs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null check (trigger in ('cron', 'admin')),
  run_date date not null,
  topic_id uuid references public.blog_topics (id) on delete set null,
  post_id uuid references public.journal_posts (id) on delete set null,
  lang text,
  status text not null default 'running' check (status in ('running', 'done', 'blocked', 'failed', 'skipped')),
  error text,
  notes text[] not null default '{}',
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric(10, 4),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
-- Une seule génération automatique par jour (même si la tâche se déclenche deux fois).
create unique index if not exists journal_generation_runs_one_cron_per_day
  on public.journal_generation_runs (run_date) where trigger = 'cron';
alter table public.journal_generation_runs enable row level security;
drop policy if exists "Admins read generation runs" on public.journal_generation_runs;
create policy "Admins read generation runs" on public.journal_generation_runs
  for select using (has_role(auth.uid(), 'admin'::app_role));

-- ---------------------------------------------------------------------------
-- 5. Publication + IndexNow
-- ---------------------------------------------------------------------------
-- Adresse publique d'un article : anglais = adresse nue, sinon ?lang= (règle du site).
create or replace function public.journal_post_url(p_slug text, p_lang text)
returns text
language sql
immutable
as $$
  select 'https://www.staymakom.com/journal/' || replace(replace(p_slug, '%', '%25'), ' ', '%20')
         || case when p_lang = 'en' then '' else '?lang=' || p_lang end;
$$;

-- Prévient Bing (IndexNow) qu'une adresse vient d'être publiée. Sans effet si la clé manque.
create or replace function public.journal_ping_indexnow(p_url text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_key text;
begin
  select indexnow_key into v_key from public.journal_settings where id;
  if v_key is null or v_key = '' then return; end if;
  -- Une panne de Bing ne doit jamais empêcher la publication : erreur ignorée (notée dans les logs).
  begin
    perform net.http_post(
      url := 'https://api.indexnow.org/indexnow',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'host', 'www.staymakom.com',
        'key', v_key,
        'keyLocation', 'https://www.staymakom.com/' || v_key || '.txt',
        'urlList', jsonb_build_array(p_url)
      )
    );
  exception when others then
    raise warning 'IndexNow non prévenu pour % : %', p_url, sqlerrm;
  end;
end;
$$;

-- Tâche planifiée : publie les articles programmés dont l'heure est passée (si l'interrupteur
-- global est allumé), en une seule écriture, puis prévient IndexNow.
create or replace function public.journal_publish_due()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_count integer := 0;
begin
  if not coalesce((select auto_publish from public.journal_settings where id), false) then
    return 0;
  end if;
  for v_row in
    update public.journal_posts
       set pipeline_status = 'published', published_at = now()
     where pipeline_status = 'scheduled' and scheduled_at <= now()
    returning slug, lang
  loop
    v_count := v_count + 1;
    perform public.journal_ping_indexnow(public.journal_post_url(v_row.slug, v_row.lang));
  end loop;
  return v_count;
end;
$$;

-- Bouton « Publier maintenant » du back-office (admins uniquement).
create or replace function public.journal_publish_now(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_lang text;
begin
  if not has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Réservé aux administrateurs';
  end if;
  update public.journal_posts
     set pipeline_status = 'published', published_at = now(), block_reason = null
   where id = p_post_id and pipeline_status <> 'published'
  returning slug, lang into v_slug, v_lang;
  if v_slug is not null then
    perform public.journal_ping_indexnow(public.journal_post_url(v_slug, v_lang));
  end if;
end;
$$;

-- Lien « Rejeter » de l'email : vérifie le jeton (usage unique, non expiré) et rejette
-- l'article dans la même transaction. Un article déjà publié est retiré du site.
create or replace function public.journal_reject_by_token(p_token_hash text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_id uuid;
  v_title text;
begin
  update public.journal_action_tokens
     set used_at = now()
   where token_hash = p_token_hash and action = 'reject' and used_at is null and expires_at > now()
  returning post_id into v_post_id;
  if v_post_id is null then
    if exists (select 1 from public.journal_action_tokens where token_hash = p_token_hash and used_at is not null) then
      return 'already_used';
    end if;
    return 'invalid';
  end if;
  update public.journal_posts
     set pipeline_status = 'rejected'
   where id = v_post_id
  returning coalesce(title, title_en) into v_title;
  return 'rejected';
end;
$$;

revoke all on function public.journal_publish_due() from public, anon, authenticated;
revoke all on function public.journal_reject_by_token(text) from public, anon, authenticated;
revoke all on function public.journal_ping_indexnow(text) from public, anon, authenticated;
grant execute on function public.journal_publish_now(uuid) to authenticated;

commit;

-- Ajout du 25/11/2026 (après le premier essai : le rédacteur s'était trompé sur les dates de
-- Hanoucca) : dates clés vérifiées par Shana, données telles quelles au rédacteur. Modifiables
-- dans le back-office (Journal > Réglages).
alter table public.journal_settings add column if not exists key_dates text not null default '';
update public.journal_settings
   set key_dates = 'Hanukkah 2026: from the evening of Friday 4 December 2026 (first candle) to Saturday 12 December 2026.'
 where id and key_dates = '';
