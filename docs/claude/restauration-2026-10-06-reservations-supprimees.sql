-- Lancé une seule fois le 06/10/2026, à la demande de Shana.
-- Remet les 22 réservations saisies à la main et les 11 demandes supprimées par erreur depuis
-- la grille de Saisie (entre 15h34 et 15h37 UTC), ainsi que les 2 liens de paiement partis avec.
-- Source : la sauvegarde backup_20261006, faite le matin même. Aucune de ces lignes n'avait été
-- modifiée entre la sauvegarde et la suppression, sauf la correction de Liron (réf 8811), rejouée ici.
-- La ligne de test « ff / rrrr » (réf 2c41), supprimée exprès, n'est pas remise.
-- Tout ou rien : si le résultat n'est pas exactement 22 / 11 / 2, rien n'est écrit.
do $$
declare n_b int; n_r int; n_p int; n_fix int;
begin
  -- Les lignes reviennent telles qu'elles étaient : ni rattachement de lead recalculé, ni date de
  -- modification changée.
  alter table public.standalone_bookings disable trigger trg_standalone_bookings_link_lead;
  alter table public.standalone_bookings disable trigger trg_standalone_bookings_updated_at;

  insert into public.standalone_experience_requests
    (id, experience_id, customer_name, customer_email, customer_phone, requested_date, adults, children, message, status, internal_notes, notified_at, created_at, updated_at, party_max, desired_time_period, desired_time_value, is_urgent, price_variant_id, selected_extras, language, preferred_city, requested_duration_minutes, source, sent_to_provider_at, provider_responded_at)
  select id, experience_id, customer_name, customer_email, customer_phone, requested_date, adults, children, message, status, internal_notes, notified_at, created_at, updated_at, party_max, desired_time_period, desired_time_value, is_urgent, price_variant_id, selected_extras, language, preferred_city, requested_duration_minutes, source, sent_to_provider_at, provider_responded_at
  from backup_20261006.standalone_experience_requests r
  where not exists (select 1 from public.standalone_experience_requests p where p.id = r.id);
  get diagnostics n_r = row_count;

  -- La sauvegarde date d'avant la colonne product_type : même règle que la migration
  -- 20261006110000 (fiche de la catégorie Bateaux, ou titre libre « Boat Day... »).
  insert into public.standalone_bookings
    (id, standalone_experience_id, customer_name, customer_email, customer_phone, user_id, booking_date, time_slot, party_size, sell_price, currency, status, payment_status, revolut_order_id, revolut_public_id, refund_amount, revolut_refund_id, refunded_at, is_cancelled, cancelled_at, confirmation_token, internal_notes, created_at, updated_at, adults_count, children_count, extras, rate_option, source, custom_experience_title, supplier_cost, deposit_amount, confirmation_email_sent_at, custom_regulations, custom_address, supplier_name, supplier_payment_status, lead_id, channel, channel_detail, provider_id, preferred_lang, product_type)
  select id, standalone_experience_id, customer_name, customer_email, customer_phone, user_id, booking_date, time_slot, party_size, sell_price, currency, status, payment_status, revolut_order_id, revolut_public_id, refund_amount, revolut_refund_id, refunded_at, is_cancelled, cancelled_at, confirmation_token, internal_notes, created_at, updated_at, adults_count, children_count, extras, rate_option, source, custom_experience_title, supplier_cost, deposit_amount, confirmation_email_sent_at, custom_regulations, custom_address, supplier_name, supplier_payment_status, lead_id, channel, channel_detail, provider_id, preferred_lang,
    case
      when exists (
        select 1 from public.standalone_experiences e
        join public.categories c on c.id = e.category_id
        where e.id = b.standalone_experience_id and c.slug = 'bateaux'
      ) then 'boat'
      when b.standalone_experience_id is null and b.custom_experience_title ilike 'boat day%' then 'boat'
      else 'experience'
    end
  from backup_20261006.standalone_bookings b
  where b.id <> '2c41c2ba-5db7-4924-8ac0-8b4cc67cbaf7'
    and not exists (select 1 from public.standalone_bookings p where p.id = b.id);
  get diagnostics n_b = row_count;

  insert into public.standalone_booking_payments
    (id, booking_id, kind, amount, currency, revolut_order_id, checkout_url, status, paid_at, created_at)
  select id, booking_id, kind, amount, currency, revolut_order_id, checkout_url, status, paid_at, created_at
  from backup_20261006.standalone_booking_payments x
  where x.booking_id <> '2c41c2ba-5db7-4924-8ac0-8b4cc67cbaf7'
    and not exists (select 1 from public.standalone_booking_payments p where p.id = x.id);
  get diagnostics n_p = row_count;

  -- Correction du matin sur Liron Tenoudji Cohen, absente de la sauvegarde.
  update public.standalone_bookings
     set is_cancelled = false,
         cancelled_at = null,
         internal_notes = '[Admin] Annulation posée par erreur lors du nettoyage du 18/09/2026, retirée le 06/10/2026 : la sortie a bien eu lieu.'
   where id = '88119c52-b8d9-4cbc-8078-ecaf9df71eb3' and is_cancelled;
  get diagnostics n_fix = row_count;

  alter table public.standalone_bookings enable trigger trg_standalone_bookings_link_lead;
  alter table public.standalone_bookings enable trigger trg_standalone_bookings_updated_at;

  if n_b <> 22 or n_r <> 11 or n_p <> 2 or n_fix <> 1 then
    raise exception 'Résultat inattendu (réservations: %, demandes: %, paiements: %, Liron: %), rien n''est écrit', n_b, n_r, n_p, n_fix;
  end if;
end $$;
