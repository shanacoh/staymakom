-- Prépare les données nécessaires au nouveau parcours public /boat :
-- badge "Notre choix", et champs de demande (heure souhaitée, urgence,
-- variante de prix demandée, extras cochés). N'affecte aucune donnée existante :
-- nouvelles colonnes nullable / avec valeur par défaut, une seule contrainte assouplie.

-- "Notre choix" : badge réglable depuis le back-office, sur n'importe quelle expérience.
alter table public.standalone_experiences add column if not exists is_featured boolean not null default false;

-- Email optionnel désormais (WhatsApp devient le contact obligatoire) : on assouplit
-- la contrainte plutôt que de la durcir, donc aucune ligne existante n'est affectée.
alter table public.standalone_experience_requests alter column customer_email drop not null;

alter table public.standalone_experience_requests add column if not exists desired_time_period text;
alter table public.standalone_experience_requests add column if not exists desired_time_value text;
alter table public.standalone_experience_requests add column if not exists is_urgent boolean not null default false;
alter table public.standalone_experience_requests add column if not exists price_variant_id uuid references public.standalone_experience_price_variants(id);
alter table public.standalone_experience_requests add column if not exists selected_extras jsonb;
alter table public.standalone_experience_requests add column if not exists language text;

comment on column public.standalone_experience_requests.desired_time_period is 'morning | afternoon | sunset | precise';
comment on column public.standalone_experience_requests.is_urgent is 'true si la date demandée est aujourd''hui ou demain (bandeau dernière minute côté client, alerte prioritaire côté back-office).';
