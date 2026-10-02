-- Étape 6 du chantier "Dossier de voyage" : fonctions publiques (token-scopées, SECURITY DEFINER)
-- pour l'écran client "Proposition". Elles ne lisent JAMAIS catalogue_items directement pour le
-- contenu affiché : uniquement catalogue_item_teasers (nom de code, description sensorielle,
-- secteur flou) et les montants totaux de la version — jamais l'adresse, les coordonnées exactes,
-- le nom réel du prestataire ou un prix ligne par ligne.

-- 1. Résout quelle étape du lien client afficher pour un token donné.
create or replace function public.dossier_voyage_resoudre_etape(p_token text)
returns table(dossier_id uuid, etape text, nom_destinataire text, objectif text, langue text)
language sql
stable security definer
set search_path to 'public'
as $function$
  select
    id,
    case
      when version_verrouillee_id is not null then 'carnet'
      when point_depart = 'explorer' and coalesce(statut_lecture, 'envoye') <> 'termine' then 'explorer'
      else 'proposition'
    end,
    nom_destinataire,
    objectif,
    langue
  from public.dossiers_voyage
  where token_public = p_token;
$function$;

-- 2. En-tête de la Proposition (et marque l'ouverture, pour le tableau de bord de Shana).
create or replace function public.dossier_voyage_get_proposition_header_by_token(p_token text)
returns table(dossier_id uuid, nom_destinataire text, objectif text, langue text, version_id uuid, prix_total_vente numeric, devise text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_dossier_id uuid;
begin
  select id into v_dossier_id from public.dossiers_voyage where token_public = p_token;
  if v_dossier_id is null then
    return;
  end if;

  update public.dossiers_voyage
  set
    premiere_ouverture_at = coalesce(premiere_ouverture_at, now()),
    derniere_ouverture_at = now(),
    nb_ouvertures = nb_ouvertures + 1
  where id = v_dossier_id;

  return query
    select d.id, d.nom_destinataire, d.objectif, d.langue, d.version_active_id, v.prix_total_vente, d.devise
    from public.dossiers_voyage d
    left join public.dossiers_voyage_versions v on v.id = d.version_active_id
    where d.id = v_dossier_id;
end;
$function$;

-- 3. Les lignes de la Proposition, habillées en teaser. Une ligne sans teaser "prêt" est
--    simplement absente (jamais de repli sur les vraies infos de la fiche Catalogue).
create or replace function public.dossier_voyage_get_proposition_lignes_by_token(p_token text)
returns table(
  ligne_id uuid, jour integer, nature text, casher boolean,
  nom_code text, nom_code_en text, nom_code_he text,
  description_sensorielle text, description_sensorielle_en text, description_sensorielle_he text,
  visuel_url text, secteur_libelle text, secteur_rayon_km numeric,
  texte_libre text
)
language sql
stable security definer
set search_path to 'public'
as $function$
  select
    l.id, l.jour, l.nature, l.casher,
    t.nom_code, t.nom_code_en, t.nom_code_he,
    t.description_sensorielle, t.description_sensorielle_en, t.description_sensorielle_he,
    t.visuel_url, t.secteur_libelle, t.secteur_rayon_km,
    l.texte_libre
  from public.dossiers_voyage d
  join public.dossiers_voyage_lignes l on l.version_id = d.version_active_id
  left join public.catalogue_item_teasers t on t.catalogue_item_id = l.catalogue_item_id
  where d.token_public = p_token
    and ((l.catalogue_item_id is null) or (t.catalogue_item_id is not null and t.statut = 'pret'))
  order by l.jour, l.ordre;
$function$;

-- 4. Réaction du client sur une ligne (j'adore / mitigé / non + commentaire libre).
create or replace function public.dossier_voyage_set_reaction(p_token text, p_ligne_id uuid, p_reaction text, p_commentaire text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_dossier_id uuid;
  v_version_id uuid;
begin
  select id, version_active_id into v_dossier_id, v_version_id from public.dossiers_voyage where token_public = p_token;
  if v_dossier_id is null then
    raise exception 'Dossier introuvable';
  end if;

  if not exists (select 1 from public.dossiers_voyage_lignes where id = p_ligne_id and version_id = v_version_id) then
    raise exception 'Ligne invalide pour ce dossier';
  end if;

  insert into public.dossiers_voyage_retours (version_id, ligne_id, reaction, commentaire)
  values (v_version_id, p_ligne_id, p_reaction, p_commentaire);
end;
$function$;

-- 5. "Envoyer mes retours" : fait passer le dossier au statut retours (une seule fois).
create or replace function public.dossier_voyage_envoyer_retours(p_token text)
returns void
language sql
security definer
set search_path to 'public'
as $function$
  update public.dossiers_voyage
  set statut = 'retours', retours_recus_at = now()
  where token_public = p_token and statut = 'envoye';
$function$;

revoke all on function public.dossier_voyage_resoudre_etape(text) from public;
revoke all on function public.dossier_voyage_get_proposition_header_by_token(text) from public;
revoke all on function public.dossier_voyage_get_proposition_lignes_by_token(text) from public;
revoke all on function public.dossier_voyage_set_reaction(text, uuid, text, text) from public;
revoke all on function public.dossier_voyage_envoyer_retours(text) from public;
grant execute on function public.dossier_voyage_resoudre_etape(text) to anon, authenticated;
grant execute on function public.dossier_voyage_get_proposition_header_by_token(text) to anon, authenticated;
grant execute on function public.dossier_voyage_get_proposition_lignes_by_token(text) to anon, authenticated;
grant execute on function public.dossier_voyage_set_reaction(text, uuid, text, text) to anon, authenticated;
grant execute on function public.dossier_voyage_envoyer_retours(text) to anon, authenticated;
