-- Scénario de test du parcours partenaire (prompt 4), à jouer APRÈS la migration, dans une
-- transaction annulée : rien n'est conservé, aucun email ne part (les envois sont mis en file
-- et la file est annulée avec le reste).
--
--   begin; \i ce_fichier; rollback;   (ou : supabase db query --linked -f fichier_entouré_de_begin_rollback)
--
-- Le bloc se termine volontairement par une erreur « RESULTATS » qui affiche chaque vérification
-- (OK / ÉCHEC) : c'est ce qui garantit l'annulation de tout.

do $$
declare
  c_provider constant uuid := '0aa52d7e-05b1-4bed-8515-442081a082d5'; -- Citrus & Salt
  c_exp uuid;
  other_exp uuid;
  b_provider uuid := gen_random_uuid();
  h_provider uuid := gen_random_uuid();
  h_hotel uuid := gen_random_uuid();
  u_c uuid := gen_random_uuid();
  u_b uuid := gen_random_uuid();
  u_h uuid := gen_random_uuid();
  u_admin uuid;
  t_c text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  t_b text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  t_h text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  r jsonb;
  s text;
  ok boolean;
  cur_role text;
  out text := '';
  hotel_version int;
  booking uuid := gen_random_uuid();

  -- petite aide : note une vérification
  procedure_dummy int;
begin
  select i.experience_id into c_exp from public.standalone_experience_internal i
  join public.standalone_experiences e on e.id = i.experience_id
  where i.provider_id = c_provider and e.status <> 'archived' order by e.created_at desc limit 1;
  select e.id into other_exp from public.standalone_experiences e
  left join public.standalone_experience_internal i on i.experience_id = e.id
  where i.provider_id is distinct from c_provider and e.status = 'published' limit 1;
  select ur.user_id into u_admin from public.user_roles ur where ur.role = 'admin' limit 1;

  -- Préparation (comme l'équipe) ------------------------------------------------------------------
  insert into auth.users (id, email, aud, role) values
    (u_c, 'test-citrus@example.invalid', 'authenticated', 'authenticated'),
    (u_b, 'test-b@example.invalid', 'authenticated', 'authenticated'),
    (u_h, 'test-hotel@example.invalid', 'authenticated', 'authenticated');
  insert into public.user_roles (user_id, role) values (u_c, 'partner'), (u_b, 'partner'), (u_h, 'partner')
  on conflict (user_id) do update set role = 'partner';
  insert into public.providers (id, name, provider_type, status, language, email)
  values (b_provider, 'Test B', 'experience', 'prospect', 'en', 'test-b@example.invalid'),
         (h_provider, 'Hôtel Test', 'hotel', 'en_discussion', 'he', 'test-hotel@example.invalid');
  insert into public.hotels2 (id, name, slug, status, story, hero_image, address, photos)
  values (h_hotel, 'Hotel Test', 'hotel-test-golive-' || left(h_hotel::text, 6), 'draft', 'A quiet hotel by the sea.',
          'https://example.invalid/hero.jpg', 'Haifa', array['https://example.invalid/1.jpg']);
  insert into public.hotel2_internal (hotel_id, provider_id) values (h_hotel, h_provider);
  insert into public.provider_users (provider_id, user_id, email) values
    (c_provider, u_c, 'test-citrus@example.invalid'), (b_provider, u_b, 'test-b@example.invalid'), (h_provider, u_h, 'test-hotel@example.invalid');
  update public.providers set partner_link_token = t_c where id = c_provider;
  update public.providers set partner_link_token = t_b where id = b_provider;
  update public.providers set partner_link_token = t_h where id = h_provider;
  -- Citrus a déjà accepté les conditions v1 avant ce chantier ; on part de l'état réel.

  -- 1. Lien Citrus, avant toute commission, sans compte ---------------------------------------------
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);

  r := public.partner_link(t_c, 'session');
  out := out || format(E'\n[1] lien ouvert sans compte, mode lien : %s', case when (r->>'link_mode')::boolean and r->'provider'->>'name' = 'Citrus & Salt' then 'OK' else 'ÉCHEC' end);

  r := public.partner_link(t_c, 'golive');
  out := out || format(E'\n[1] go live calculé, étape en cours = %s, votre tour = %s, %s/%s préparés par l''équipe, %s pour vous',
    r->>'current_step', r->>'my_turn', r->'counts'->>'prepared_by_team', r->'counts'->>'total', r->'counts'->>'for_you');

  r := public.partner_link(t_c, 'listing', jsonb_build_object('kind', 'experience', 'id', c_exp));
  s := r::text;
  out := out || format(E'\n[1] aperçu sans prix client, marge ni prix fournisseur : %s',
    case when s !~ '"(base_price|base_price_child|markup_percent|supplier_price_adult|supplier_price_child|original_price|customer_email|customer_phone)"' then 'OK' else 'ÉCHEC' end);

  foreach s in array array['story', 'photos', 'inclusions', 'practical'] loop
    begin
      perform public.partner_link(t_c, 'confirm_section', jsonb_build_object('kind', 'experience', 'id', c_exp, 'section', s));
      out := out || format(E'\n[1] « Ça me va » sur %s : OK', s);
    exception when others then
      out := out || format(E'\n[1] « Ça me va » sur %s : %s', s, sqlerrm);
    end;
  end loop;

  r := public.partner_link(t_c, 'set_rules', jsonb_build_object('id', c_exp, 'rules', jsonb_build_object(
    'min_party', 2, 'max_party', 8, 'min_age', '12', 'lead_time_days', '2', 'available_days', jsonb_build_array(1,2,3,4,7),
    'private_groups_only', false, 'know_before_you_go', 'Closed shoes, please.', 'free_cancellation_hours', 24)));
  cur_role := current_setting('role');
  perform set_config('role', 'postgres', true);
    select (e.free_cancellation_hours = 24 and e.cancellation_policy like 'Free cancellation up to 24 hours%' and e.min_party = 2 and e.max_party = 8
          and e.available_days = '[1,2,3,4,7]'::jsonb)
  into ok from public.standalone_experiences e where e.id = c_exp;
  perform set_config('role', cur_role, true);
  out := out || format(E'\n[4] règles appliquées tout de suite (groupe 2-8, jours fermés, 24 h, texte d''annulation mis à jour) : %s', case when ok then 'OK' else 'ÉCHEC' end);
  cur_role := current_setting('role');
  perform set_config('role', 'postgres', true);
    select exists (select 1 from public.partner_activity_log l where l.provider_id = c_provider and l.action = 'rules' and l.via_link and l.user_id is null)
  into ok;
  perform set_config('role', cur_role, true);
  out := out || format(E'\n[4] règles tracées (« par le lien », date) : %s', case when ok then 'OK' else 'ÉCHEC' end);
  cur_role := current_setting('role');
  perform set_config('role', 'postgres', true);
    select exists (select 1 from net.http_request_queue q where convert_from(q.body, 'UTF8') like '%rules_changed%') into ok;
  perform set_config('role', cur_role, true);
  out := out || format(E'\n[4] notification équipe mise en file : %s', case when ok then 'OK' else 'non vérifiable (file)' end);

  perform public.partner_link(t_c, 'confirm_section', jsonb_build_object('kind', 'experience', 'id', c_exp, 'section', 'rules'));
  perform public.partner_link(t_c, 'set_public_price', jsonb_build_object('id', c_exp, 'adult', '250', 'child', '150'));
  perform public.partner_link(t_c, 'set_day_contact', jsonb_build_object('id', c_exp, 'name', 'Dana', 'phone', '+972500000000', 'language', 'he'));
  r := public.partner_link(t_c, 'submit_note', jsonb_build_object('kind', 'experience', 'id', c_exp, 'section', 'photos', 'text', 'Please use the photo of the lemon tree first.'));
  cur_role := current_setting('role');
  perform set_config('role', 'postgres', true);
    select exists (select 1 from public.partner_proposals p where p.id = (r #>> '{}')::uuid and p.via_link and p.status = 'pending')
  into ok;
  perform set_config('role', cur_role, true);
  out := out || format(E'\n[3] « Proposer une modification » par la table des propositions, en attente de validation : %s', case when ok then 'OK' else 'ÉCHEC' end);

  r := public.partner_link(t_c, 'golive');
  out := out || format(E'\n[2] après relecture : étape en cours = %s (qui agit : %s), %s pour vous',
    r->>'current_step', case when (r->>'my_turn')::boolean then 'vous' else 'STAYMAKOM' end, r->'counts'->>'for_you');
  out := out || format(E'\n[5bis] commission vide → étape conditions « en attente de l''équipe » : %s',
    case when (select (st->>'waiting_commission')::boolean and st->>'actor' = 'staymakom' from jsonb_array_elements(r->'steps') st where st->>'key' = 'terms') then 'OK' else 'ÉCHEC' end);

  -- 9. Sécurité du lien -----------------------------------------------------------------------------
  begin
    perform public.partner_link(t_c, 'bookings');
    out := out || E'\n[9] lien → réservations : ÉCHEC (accessible)';
  exception when others then
    out := out || format(E'\n[9] lien → réservations refusé (%s) : OK', sqlerrm);
  end;
  begin
    perform public.partner_bookings();
    out := out || E'\n[9] visiteur → réservations : ÉCHEC';
  exception when others then
    out := out || format(E'\n[9] visiteur sans compte → réservations refusé (%s) : OK', sqlerrm);
  end;
  begin
    perform public.partner_sign_contract(1, 'X', 'Y', 'data:image/png;base64,AAAA', true, '{}');
    out := out || E'\n[9] visiteur → signature : ÉCHEC';
  exception when others then
    out := out || format(E'\n[9] sans compte → signature refusée (%s) : OK', sqlerrm);
  end;
  begin
    perform public.partner_accept_terms(1, 'X');
    out := out || E'\n[9] visiteur → acceptation des conditions : ÉCHEC';
  exception when others then
    out := out || format(E'\n[9] sans compte → acceptation refusée (%s) : OK', sqlerrm);
  end;
  begin
    perform public.partner_link(t_c, 'listing', jsonb_build_object('kind', 'experience', 'id', other_exp));
    out := out || E'\n[9] lien A → annonce d''un autre : ÉCHEC';
  exception when others then
    out := out || format(E'\n[9] lien Citrus → annonce d''un autre prestataire refusée (%s) : OK', sqlerrm);
  end;
  begin
    perform public.partner_link(t_b, 'listing', jsonb_build_object('kind', 'experience', 'id', c_exp));
    out := out || E'\n[9] lien B → annonce de Citrus : ÉCHEC';
  exception when others then
    out := out || format(E'\n[9] lien B → annonce de Citrus refusée (%s) : OK', sqlerrm);
  end;
  begin
    perform public.partner_link(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 'session');
    out := out || E'\n[9] jeton inventé : ÉCHEC';
  exception when others then
    out := out || format(E'\n[9] jeton inventé refusé (%s) : OK', sqlerrm);
  end;
  begin
    perform public.partner_experience(c_exp);
    out := out || E'\n[9] visiteur → fonction partenaire en direct : ÉCHEC';
  exception when others then
    out := out || format(E'\n[9] visiteur → fonctions partenaire en direct refusées (%s) : OK', sqlerrm);
  end;
  begin
    perform 1 from public.providers limit 1;
    select count(*) = 0 into ok from public.providers;
    out := out || format(E'\n[9] visiteur → table des prestataires (liens, commissions) : %s', case when ok then 'OK (rien)' else 'ÉCHEC' end);
  exception when others then
    out := out || format(E'\n[9] visiteur → table des prestataires refusée (%s) : OK', sqlerrm);
  end;
  begin
    select count(*) = 0 into ok from public.partner_terms_acceptances;
    out := out || format(E'\n[9] visiteur → contrats signés : %s', case when ok then 'OK (rien)' else 'ÉCHEC' end);
  exception when others then
    out := out || format(E'\n[9] visiteur → contrats signés refusés (%s) : OK', sqlerrm);
  end;
  select count(*) = 0 into ok from storage.objects where bucket_id = 'partner-contracts';
  out := out || format(E'\n[9] visiteur → PDF signés du stockage : %s', case when ok then 'OK (rien)' else 'ÉCHEC' end);

  -- 2. Côté équipe : commission saisie après accord -------------------------------------------------
  perform set_config('role', 'postgres', true);
  update public.providers set commission_type = 'percent', commission_value = 20 where id = c_provider;
  cur_role := current_setting('role');
  perform set_config('role', 'postgres', true);
    select commission_percent = 20 into ok from public.providers where id = c_provider;
  perform set_config('role', cur_role, true);
  out := out || format(E'\n[5bis] commission 20 %% saisie, ancienne colonne tenue à jour : %s', case when ok then 'OK' else 'ÉCHEC' end);
  perform set_config('request.jwt.claims', json_build_object('sub', u_admin, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  r := public.admin_set_experience_commercials(c_exp, 250, 150, null, null, null, false);
  out := out || format(E'\n[5bis] prix fournisseur déduit = %s (prix public 250 - 20 %%), « à vérifier » = %s', r->>'derived_adult', r->>'to_check');

  -- 3. Citrus, connecté : la commission a changé, il doit accepter à nouveau ------------------------
  perform set_config('request.jwt.claims', json_build_object('sub', u_c, 'role', 'authenticated')::text, true);
  r := public.partner_session();
  out := out || format(E'\n[5bis] commission modifiée après signature → doit accepter à nouveau : %s', case when (r->'terms'->>'must_accept')::boolean then 'OK' else 'ÉCHEC' end);
  begin
    perform public.partner_bookings();
    out := out || E'\n[5bis] réservations avant nouvelle acceptation : ÉCHEC (accessibles)';
  exception when others then
    out := out || format(E'\n[5bis] réservations bloquées tant que non ré-acceptées (%s) : OK', sqlerrm);
  end;
  r := public.partner_accept_terms((r->'terms'->>'current_version')::int, 'Test Citrus');
  cur_role := current_setting('role');
  perform set_config('role', 'postgres', true);
    select a.commission_snapshot->>'value' = '20' into ok from public.partner_terms_acceptances a where a.provider_id = c_provider order by a.accepted_at desc limit 1;
  perform set_config('role', cur_role, true);
  out := out || format(E'\n[5bis] commission enregistrée dans la trace d''acceptation : %s', case when ok then 'OK' else 'ÉCHEC' end);
  r := public.partner_bookings();
  s := r::text;
  out := out || format(E'\n[9] réservations du partenaire sans email, téléphone, prix client ni marge : %s (%s réservations)',
    case when s !~ '"(customer_email|customer_phone|sell_price|markup_percent|deposit_amount)"' and s !~ '@' then 'OK' else 'ÉCHEC' end, jsonb_array_length(r));
  r := public.partner_golive();
  out := out || format(E'\n[2] Citrus connecté, go live : étape en cours = %s ; étapes faites = %s',
    coalesce(r->>'current_step', 'aucune (tout est fait)'),
    (select string_agg(st->>'key', ', ') from jsonb_array_elements(r->'steps') st where (st->>'done')::boolean));

  -- A ne voit rien de B
  begin
    perform public.partner_listing('experience', other_exp);
    out := out || E'\n[9] partenaire A → annonce de B : ÉCHEC';
  exception when others then
    out := out || format(E'\n[9] partenaire A → annonce d''un autre refusée (%s) : OK', sqlerrm);
  end;
  begin
    r := public.partner_link(t_b, 'session');
    out := out || format(E'\n[9] Citrus connecté qui ouvre le lien de B : ne voit que B (%s) : %s', r->'provider'->>'name',
      case when r->'provider'->>'name' = 'Test B' then 'OK' else 'ÉCHEC' end);
  exception when others then
    out := out || format(E'\n[9] lien B ouvert par Citrus : %s', sqlerrm);
  end;
  select count(*) = 0 into ok from public.providers;
  out := out || format(E'\n[9] partenaire connecté → table des prestataires : %s', case when ok then 'OK (rien)' else 'ÉCHEC' end);
  select count(*) = 0 into ok from public.standalone_experience_internal;
  out := out || format(E'\n[9] partenaire connecté → marges et prix fournisseurs (table interne) : %s', case when ok then 'OK (rien)' else 'ÉCHEC' end);
  select count(*) = 0 into ok from public.standalone_bookings where customer_email is not null;
  out := out || format(E'\n[9] partenaire connecté → emails clients : %s', case when ok then 'OK (rien)' else 'ÉCHEC' end);

  -- B connecté : rien de Citrus, pas de réservations sans conditions
  perform set_config('request.jwt.claims', json_build_object('sub', u_b, 'role', 'authenticated')::text, true);
  begin
    perform public.partner_experience(c_exp);
    out := out || E'\n[9] partenaire B → fiche de Citrus : ÉCHEC';
  exception when others then
    out := out || format(E'\n[9] partenaire B → fiche de Citrus refusée (%s) : OK', sqlerrm);
  end;
  begin
    perform public.partner_bookings();
    out := out || E'\n[9] B non signé → réservations : ÉCHEC';
  exception when others then
    out := out || format(E'\n[9] B non signé → réservations refusées (%s) : OK', sqlerrm);
  end;

  -- Réservation payée : elle garde la politique et la commission du moment --------------------------
  perform set_config('role', 'postgres', true);
  insert into public.standalone_bookings (id, standalone_experience_id, customer_name, customer_email, booking_date, party_size, sell_price, currency, status, payment_status, provider_id)
  values (booking, c_exp, 'Test Client', 'client@example.invalid', current_date + 10, 2, 600, 'ILS', 'confirmed', 'paid', c_provider);
  update public.standalone_experiences set free_cancellation_hours = 48, cancellation_policy = 'Free cancellation up to 48 hours before the experience.' where id = c_exp;
  cur_role := current_setting('role');
  perform set_config('role', 'postgres', true);
    select b.free_cancellation_hours = 24 and b.cancellation_policy_snapshot->>'en' like '%24 hours%' and b.commission_snapshot->>'value' = '20'
  into ok from public.standalone_bookings b where b.id = booking;
  perform set_config('role', cur_role, true);
  out := out || format(E'\n[4] réservation payée : garde 24 h et 20 %% même si la fiche repasse à 48 h : %s', case when ok then 'OK' else 'ÉCHEC' end);

  -- 5. Hôtel de test : contrat signé en ligne -------------------------------------------------------
  update public.partner_terms_versions
  set text_en = 'HOTEL AGREEMENT between STAYMAKOM and {{company}} ({{registration_number}}), {{address}}, for {{hotel_name}}. Commission: {{commission}}. Signed by {{signatory_name}}, {{signatory_title}}, on {{date}}.',
      published_at = now()
  where kind = 'hotel_contract' and published_at is null
  returning version into hotel_version;
  update public.providers set hotel_agreement_at = now() where id = h_provider;

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  r := public.partner_link(t_h, 'golive');
  out := out || format(E'\n[hôtel] lien avant signature : étape en cours = %s (votre tour = %s)', r->>'current_step', r->>'my_turn');
  foreach s in array array['story', 'photos', 'rooms', 'practical'] loop
    begin
      perform public.partner_link(t_h, 'confirm_section', jsonb_build_object('kind', 'hotel', 'id', h_hotel, 'section', s));
    exception when others then
      out := out || format(E'\n[hôtel] « Ça me va » sur %s : %s', s, sqlerrm);
    end;
  end loop;
  perform public.partner_link(t_h, 'submit_note', jsonb_build_object('kind', 'hotel', 'id', h_hotel, 'section', 'rooms', 'text', 'Our suites have a sea view.'));
  r := public.partner_link(t_h, 'golive');
  out := out || format(E'\n[hôtel] après relecture : étape en cours = %s (commission vide → %s)', r->>'current_step',
    case when (r->>'my_turn')::boolean then 'vous' else 'en attente de STAYMAKOM' end);

  perform set_config('role', 'postgres', true);
  update public.providers set commission_type = 'percent', commission_value = 15 where id = h_provider;
  begin
    update public.providers set commission_type = 'fixed', commission_value = 50, commission_fixed_unit = 'per_booking' where id = h_provider;
    out := out || E'\n[5bis] hôtel en montant fixe : ÉCHEC (accepté)';
  exception when others then
    out := out || E'\n[5bis] hôtel : pourcentage uniquement : OK';
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', u_h, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  r := public.partner_session();
  out := out || format(E'\n[5] hôtel connecté : contrat à signer = %s, type = %s, variables pré-remplies (hôtel %s, commission %s)',
    r->'terms'->>'must_accept', r->'terms'->>'kind', r->'contract_variables'->>'hotel_name', r->'contract_variables'->>'commission');
  begin
    perform public.partner_accept_terms(hotel_version, 'Moshe');
    out := out || E'\n[5] hôtel sans signature dessinée : ÉCHEC (accepté)';
  exception when others then
    out := out || format(E'\n[5] hôtel : simple case refusée, signature au doigt exigée (%s) : OK', sqlerrm);
  end;
  r := public.partner_sign_contract(hotel_version, 'Moshe Levi', 'General Manager',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', true,
    jsonb_build_object('company', 'Hotel Test Ltd', 'registration_number', '515000000', 'address', '1 Sea Road, Haifa'));
  cur_role := current_setting('role');
  perform set_config('role', 'postgres', true);
    select a.rendered_text like '%Hotel Test Ltd (515000000)%Commission: 15%Moshe Levi, General Manager%'
         and a.signer_title = 'General Manager' and a.authorized_to_sign and a.commission_snapshot->>'value' = '15'
         and a.kind = 'hotel_contract' and a.user_id = u_h
  into ok from public.partner_terms_acceptances a where a.id = (r->>'acceptance_id')::uuid;
  perform set_config('role', cur_role, true);
  out := out || format(E'\n[5] contrat signé : texte rempli, fonction, signature, autorisation, commission, utilisateur tracés : %s', case when ok then 'OK' else 'ÉCHEC' end);
  cur_role := current_setting('role');
  perform set_config('role', 'postgres', true);
    select legal_name = 'Hotel Test Ltd' and signatory_name = 'Moshe Levi' into ok from public.providers where id = h_provider;
  perform set_config('role', cur_role, true);
  out := out || format(E'\n[5] informations modifiées à la signature reportées sur sa fiche : %s', case when ok or ok is null then 'OK' else 'ÉCHEC' end);
  r := public.partner_golive();
  out := out || format(E'\n[hôtel] après signature : étape en cours = %s', r->>'current_step');

  perform set_config('role', 'postgres', true);
  update public.providers set hg_channel_manager_at = now(), hg_rooms_mapped_at = now(), hg_test_booking_at = now() where id = h_provider;
  update public.hotels2 set status = 'published' where id = h_hotel;
  r := public.partner_golive_of(h_provider);
  out := out || format(E'\n[hôtel] HyperGuest coché + page publiée : go live terminé = %s', case when r->>'current_step' is null then 'OK' else 'ÉCHEC (' || (r->>'current_step') || ')' end);

  -- Révocation du lien -----------------------------------------------------------------------------
  update public.providers set partner_link_token = null where id = c_provider;
  perform set_config('role', 'anon', true);
  begin
    perform public.partner_link(t_c, 'session');
    out := out || E'\n[9] lien révoqué : ÉCHEC (encore actif)';
  exception when others then
    out := out || format(E'\n[9] lien révoqué ne donne plus accès (%s) : OK', sqlerrm);
  end;
  perform set_config('role', 'postgres', true);

  raise exception 'RESULTATS %', out;
end $$;
