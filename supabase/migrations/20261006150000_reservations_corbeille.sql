-- Corbeille de la page Réservations (back-office).
-- Toute ligne de la page (réservation d'expérience ou de bateau, demande, hôtel, dossier de
-- voyage) se supprime de la même façon : la ligne et ses lignes rattachées sont d'abord copiées
-- dans la corbeille, puis supprimées, dans la même opération. Une suppression par erreur se
-- rattrape avec « Restaurer », qui remet tout à l'identique.

create table public.deleted_reservations (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('booking', 'request', 'hotel', 'dossier')),
  row_id uuid not null,
  -- Repères d'affichage dans la liste Corbeille.
  client text,
  product text,
  amount numeric,
  currency text,
  -- { row: la ligne, children: [{ table, rows }] dans l'ordre de remise, links: liens à renouer }
  payload jsonb not null,
  deleted_at timestamptz not null default now(),
  deleted_by uuid default auth.uid()
);

comment on table public.deleted_reservations is 'Corbeille de la page Réservations : copie complète de chaque ligne supprimée, pour pouvoir la restaurer.';

alter table public.deleted_reservations enable row level security;

create policy deleted_reservations_admin_all on public.deleted_reservations
  for all
  using (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = 'admin'::app_role))
  with check (exists (select 1 from public.user_roles where user_roles.user_id = auth.uid() and user_roles.role = 'admin'::app_role));

revoke all on public.deleted_reservations from anon;
grant select, insert, delete on public.deleted_reservations to authenticated;

-- Suppression d'une ou plusieurs lignes : [{ "source": "booking", "id": "..." }, ...].
-- Tout ou rien : si une seule ligne pose problème, aucune n'est supprimée.
-- S'exécute avec les droits de l'appelant : seuls les admins peuvent lire et supprimer ces tables.
create or replace function public.delete_reservations(p_items jsonb)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  item jsonb;
  v_source text;
  v_id uuid;
  v_row jsonb;
  v_children jsonb;
  v_links jsonb;
  v_client text;
  v_product text;
  v_amount numeric;
  v_currency text;
  n integer := 0;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Aucune ligne à supprimer';
  end if;

  for item in select * from jsonb_array_elements(p_items) loop
    v_source := item->>'source';
    v_id := (item->>'id')::uuid;
    v_row := null;
    v_children := '[]'::jsonb;
    v_links := '{}'::jsonb;
    v_client := null;
    v_product := null;
    v_amount := null;
    v_currency := null;

    select a.client, a.product, a.amount, a.currency
      into v_client, v_product, v_amount, v_currency
    from public.admin_reservations a
    where a.source = v_source and a.id = v_id;

    if v_source = 'booking' then
      select to_jsonb(b) into v_row from public.standalone_bookings b where b.id = v_id;
      v_children := jsonb_build_array(jsonb_build_object(
        'table', 'standalone_booking_payments',
        'rows', coalesce((select jsonb_agg(to_jsonb(p)) from public.standalone_booking_payments p where p.booking_id = v_id), '[]'::jsonb)));
      delete from public.standalone_bookings where id = v_id;

    elsif v_source = 'request' then
      select to_jsonb(r) into v_row from public.standalone_experience_requests r where r.id = v_id;
      -- La réservation issue de cette demande perd son lien à la suppression : on le note pour le renouer.
      v_links := jsonb_build_object('booking_ids',
        coalesce((select jsonb_agg(b.id) from public.standalone_bookings b where b.request_id = v_id), '[]'::jsonb));
      delete from public.standalone_experience_requests where id = v_id;

    elsif v_source = 'hotel' then
      select to_jsonb(h) into v_row from public.bookings_hg h where h.id = v_id;
      delete from public.bookings_hg where id = v_id;

    elsif v_source = 'dossier' then
      select to_jsonb(d) into v_row from public.dossiers_voyage d where d.id = v_id;
      v_children := jsonb_build_array(
        jsonb_build_object('table', 'dossiers_voyage_versions', 'rows', coalesce((
          select jsonb_agg(to_jsonb(v)) from public.dossiers_voyage_versions v where v.dossier_id = v_id), '[]'::jsonb)),
        jsonb_build_object('table', 'dossiers_voyage_lignes', 'rows', coalesce((
          select jsonb_agg(to_jsonb(l)) from public.dossiers_voyage_lignes l
          where l.version_id in (select v.id from public.dossiers_voyage_versions v where v.dossier_id = v_id)), '[]'::jsonb)),
        jsonb_build_object('table', 'dossiers_voyage_retours', 'rows', coalesce((
          select jsonb_agg(to_jsonb(x)) from public.dossiers_voyage_retours x
          where x.version_id in (select v.id from public.dossiers_voyage_versions v where v.dossier_id = v_id)), '[]'::jsonb)),
        jsonb_build_object('table', 'dossier_propositions', 'rows', coalesce((
          select jsonb_agg(to_jsonb(dp)) from public.dossier_propositions dp where dp.dossier_id = v_id), '[]'::jsonb)),
        jsonb_build_object('table', 'participants', 'rows', coalesce((
          select jsonb_agg(to_jsonb(pa)) from public.participants pa where pa.dossier_id = v_id), '[]'::jsonb)),
        jsonb_build_object('table', 'swipes', 'rows', coalesce((
          select jsonb_agg(to_jsonb(s)) from public.swipes s
          where s.participant_id in (select pa.id from public.participants pa where pa.dossier_id = v_id)
             or s.dossier_proposition_id in (select dp.id from public.dossier_propositions dp where dp.dossier_id = v_id)), '[]'::jsonb)));
      -- Les dossiers créés à partir de celui-ci perdent leur lien à la suppression.
      v_links := jsonb_build_object('model_child_ids',
        coalesce((select jsonb_agg(d.id) from public.dossiers_voyage d where d.modele_source_id = v_id), '[]'::jsonb));
      delete from public.dossiers_voyage where id = v_id;

    else
      raise exception 'Type de ligne inconnu : %', v_source;
    end if;

    if v_row is null then
      raise exception 'Ligne introuvable ou non supprimable. Recharge la liste.';
    end if;

    insert into public.deleted_reservations (source, row_id, client, product, amount, currency, payload)
    values (
      v_source,
      v_id,
      coalesce(v_client, v_row->>'customer_name', v_row->>'nom_destinataire'),
      v_product,
      v_amount,
      v_currency,
      jsonb_build_object('row', v_row, 'children', v_children, 'links', v_links)
    );
    n := n + 1;
  end loop;

  return n;
end;
$$;

-- Restauration d'une ligne de la corbeille : la ligne et ses lignes rattachées reviennent à
-- l'identique, puis l'entrée quitte la corbeille. Tout ou rien.
create or replace function public.restore_deleted_reservation(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  t public.deleted_reservations;
  v_row jsonb;
  child jsonb;
  v_table text;
  v_cols text;
  v_ref uuid;
  allowed constant text[] := array[
    'standalone_booking_payments', 'dossiers_voyage_versions', 'dossiers_voyage_lignes',
    'dossiers_voyage_retours', 'dossier_propositions', 'participants', 'swipes'
  ];
begin
  select * into t from public.deleted_reservations where id = p_id for update;
  if not found then
    raise exception 'Cette ligne n''est plus dans la corbeille. Recharge la liste.';
  end if;
  v_row := t.payload->'row';

  if t.source = 'booking' then
    -- Le lien vers la demande d'origine n'est gardé que si elle existe encore et reste libre.
    v_ref := nullif(v_row->>'request_id', '')::uuid;
    if v_ref is not null and (
      not exists (select 1 from public.standalone_experience_requests r where r.id = v_ref)
      or exists (select 1 from public.standalone_bookings b where b.request_id = v_ref)
    ) then
      v_row := v_row || jsonb_build_object('request_id', null);
    end if;
    insert into public.standalone_bookings select * from jsonb_populate_record(null::public.standalone_bookings, v_row);

  elsif t.source = 'request' then
    insert into public.standalone_experience_requests select * from jsonb_populate_record(null::public.standalone_experience_requests, v_row);
    update public.standalone_bookings b
       set request_id = t.row_id
     where b.request_id is null
       and b.id in (select value::uuid from jsonb_array_elements_text(coalesce(t.payload->'links'->'booking_ids', '[]'::jsonb)));

  elsif t.source = 'hotel' then
    insert into public.bookings_hg select * from jsonb_populate_record(null::public.bookings_hg, v_row);

  elsif t.source = 'dossier' then
    v_ref := nullif(v_row->>'modele_source_id', '')::uuid;
    if v_ref is not null and not exists (select 1 from public.dossiers_voyage d where d.id = v_ref) then
      v_row := v_row || jsonb_build_object('modele_source_id', null);
    end if;
    -- Le dossier pointe vers ses versions et ses versions vers lui : il revient d'abord sans
    -- ces pointeurs, remis à la fin.
    insert into public.dossiers_voyage
    select * from jsonb_populate_record(
      null::public.dossiers_voyage,
      v_row || jsonb_build_object('version_active_id', null, 'version_verrouillee_id', null));
  end if;

  for child in select * from jsonb_array_elements(coalesce(t.payload->'children', '[]'::jsonb)) loop
    v_table := child->>'table';
    if not (v_table = any (allowed)) then
      raise exception 'Table inattendue dans la corbeille : %', v_table;
    end if;
    if jsonb_array_length(child->'rows') > 0 then
      execute format('insert into public.%I select * from jsonb_populate_recordset(null::public.%I, $1)', v_table, v_table)
        using child->'rows';
    end if;
  end loop;

  if t.source = 'dossier' then
    -- Remet toutes les colonnes du dossier à leur valeur d'origine : les pointeurs de version,
    -- et les compteurs de lecture que le retour des participants vient de faire bouger.
    select string_agg(quote_ident(a.attname), ', ') into v_cols
    from pg_attribute a
    where a.attrelid = 'public.dossiers_voyage'::regclass and a.attnum > 0 and not a.attisdropped and a.attname <> 'id';
    execute format(
      'update public.dossiers_voyage d set (%1$s) = (select %1$s from jsonb_populate_record(null::public.dossiers_voyage, $1)) where d.id = $2',
      v_cols)
      using v_row, t.row_id;
    update public.dossiers_voyage d
       set modele_source_id = t.row_id
     where d.modele_source_id is null
       and d.id in (select value::uuid from jsonb_array_elements_text(coalesce(t.payload->'links'->'model_child_ids', '[]'::jsonb)));
  end if;

  delete from public.deleted_reservations where id = p_id;
exception
  when unique_violation then
    raise exception 'Restauration impossible : cette ligne existe déjà.';
  when foreign_key_violation then
    raise exception 'Restauration impossible : un élément lié (fiche, hôtel, version) n''existe plus.';
end;
$$;

revoke execute on function public.delete_reservations(jsonb) from anon, public;
grant execute on function public.delete_reservations(jsonb) to authenticated;
revoke execute on function public.restore_deleted_reservation(uuid) from anon, public;
grant execute on function public.restore_deleted_reservation(uuid) to authenticated;
