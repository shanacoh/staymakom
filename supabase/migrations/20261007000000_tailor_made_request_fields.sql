-- Refonte du formulaire « Tailor-made request », migration 1 : la base.
-- Une demande de voyage sur mesure n'a plus de table à elle : c'est un dossier de voyage
-- (dossiers_voyage, déjà la fiche d'une réservation d'itinéraire) à son tout premier statut,
-- « Demande sur-mesure ». Cette migration n'ajoute que des cases et un statut : elle ne change
-- rien à ce que le site et le back-office affichent aujourd'hui.
begin;

-- 1) Les réponses du formulaire, gardées telles que le client les a données. Colonne à part de
--    brief_data, que la génération du brief réécrit entièrement.
alter table public.dossiers_voyage add column demande_formulaire jsonb;
-- Pas de liste fermée ici : les fourchettes proposées peuvent évoluer, elles sont vérifiées par
-- la fonction serveur du formulaire.
alter table public.dossiers_voyage add column budget_fourchette text;

comment on column public.dossiers_voyage.demande_formulaire is 'Réponses du formulaire « Tailor-made request » du site, telles que saisies par le client (type de séjour, dates, voyageurs, envies, contraintes, source de la visite). Jamais réécrit par le brief.';
comment on column public.dossiers_voyage.budget_fourchette is 'Fourchette de budget total hors vols, en euros, choisie par le client dans le formulaire.';

-- 2) Le nouveau premier statut.
alter table public.dossiers_voyage drop constraint dossiers_voyage_statut_check;
alter table public.dossiers_voyage
  add constraint dossiers_voyage_statut_check check (statut in (
    'demande_sur_mesure',
    'nouvelle_demande','brief','en_preparation','envoye','retours',
    'paye','collab_confirme','confirme','en_voyage','termine','perdu'
  ));

-- 3) Une référence courte par demande (TM-1001, TM-1002...), citée dans le message WhatsApp du client.
create sequence public.dossiers_voyage_tm_ref_seq start with 1001;
create unique index dossiers_voyage_reference_tm_unique
  on public.dossiers_voyage (reference) where reference like 'TM-%';

-- 4) Un contact peut désormais exister sans email : le formulaire sur mesure ne demande que le
--    prénom et le WhatsApp. La page Leads signale ces fiches par « Email manquant ».
alter table public.leads alter column email drop not null;

-- 5) Enregistrement d'une demande : la fiche contact et le dossier sont créés ensemble ou pas du
--    tout. Réservé à la fonction serveur du formulaire (service_role). L'accord aux nouvelles de
--    Staymakom (phrase sous le formulaire) ne vaut que si un email est donné.
create or replace function public.create_tailor_made_request(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first_name text := nullif(trim(p->>'first_name'), '');
  v_whatsapp text := nullif(trim(p->>'whatsapp'), '');
  v_email text := nullif(lower(trim(p->>'email')), '');
  v_adults int := coalesce((p->>'adultes')::int, 0);
  v_children int := coalesce((p->>'enfants')::int, 0);
  v_flexible boolean := (p->>'dates_mode') = 'flexibles';
  v_regions text[];
  v_lead_id uuid;
  v_reference text;
  v_id uuid;
begin
  if v_first_name is null or v_whatsapp is null then
    raise exception 'Prénom et WhatsApp obligatoires';
  end if;

  if jsonb_typeof(p->'regions_libelles') = 'array' then
    select array_agg(value) into v_regions from jsonb_array_elements_text(p->'regions_libelles');
  end if;

  insert into public.leads (source, email, first_name, name, phone, marketing_opt_in, is_b2b, metadata)
  values ('tailored_request', v_email, v_first_name, v_first_name, v_whatsapp, v_email is not null, false, coalesce(p->'source', '{}'::jsonb))
  returning id into v_lead_id;

  v_reference := 'TM-' || nextval('public.dossiers_voyage_tm_ref_seq');

  insert into public.dossiers_voyage (
    reference, nom_destinataire, email, telephone, langue, lead_id,
    destinataire_type, objectif, point_depart, canal_origine, statut,
    dates_arrivee, dates_depart, nb_voyageurs, regions, devise,
    budget_fourchette, demande_formulaire
  ) values (
    v_reference, v_first_name, v_email, v_whatsapp, p->>'langue', v_lead_id,
    'client', 'vente', 'proposition', 'formulaire_site', 'demande_sur_mesure',
    case when v_flexible then null else (p->>'date_debut')::date end,
    case when v_flexible then null else (p->>'date_fin')::date end,
    nullif(v_adults + v_children, 0), v_regions, 'EUR',
    p->>'budget',
    p - 'first_name' - 'whatsapp' - 'email' - 'regions_libelles'
  )
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'reference', v_reference);
end;
$$;

comment on function public.create_tailor_made_request(jsonb) is 'Formulaire « Tailor-made request » : crée le contact et le dossier de voyage au statut demande_sur_mesure, dans la même opération. Appelée uniquement par la fonction serveur submit-tailor-made-request.';

revoke all on function public.create_tailor_made_request(jsonb) from public, anon, authenticated;
grant execute on function public.create_tailor_made_request(jsonb) to service_role;

commit;
