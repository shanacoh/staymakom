-- Étape 5 (suite) du chantier "Dossier de voyage" : les lieux que Shana ou le client veulent
-- absolument garder se saisissent dès le Brief, avant même que le Composer existe.
alter table public.dossiers_voyage
  add column lieux_imposes jsonb not null default '[]'::jsonb;

comment on column public.dossiers_voyage.lieux_imposes is 'Lieux que Shana ou le client veulent absolument garder, saisis dès le Brief (avant même que le Composer existe). Chaque entrée : {catalogue_item_id, nom, origine: impose_shana|demande_client}. Toujours respectés par l''IA lors de la génération du programme.';
