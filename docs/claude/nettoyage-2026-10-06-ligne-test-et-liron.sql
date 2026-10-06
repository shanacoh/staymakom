-- À lancer une seule fois dans Supabase (SQL Editor), demandé par Shana le 06/10/2026.
-- 1) Supprime la réservation de test « ff / rrrr » (réf 2c41) et ses 2 paiements rattachés.
-- 2) Retire l'annulation posée par erreur le 18/09 sur la réservation de Liron Tenoudji Cohen
--    (réf 8811, Boat Day du 04/09) : la sortie a bien eu lieu.
-- Tout ou rien : si la sauvegarde backup_20261006 ne contient pas ces lignes, ou si le
-- résultat n'est pas exactement « 1 supprimée, 1 corrigée », rien n'est modifié.
do $$
declare n_b int; n_p int; n_del int; n_upd int;
begin
  select count(*) into n_b from backup_20261006.standalone_bookings
   where id in ('2c41c2ba-5db7-4924-8ac0-8b4cc67cbaf7', '88119c52-b8d9-4cbc-8078-ecaf9df71eb3');
  select count(*) into n_p from backup_20261006.standalone_booking_payments
   where booking_id = '2c41c2ba-5db7-4924-8ac0-8b4cc67cbaf7';
  if n_b <> 2 or n_p <> 2 then
    raise exception 'Sauvegarde incomplète (réservations: %, paiements: %), rien n''est modifié', n_b, n_p;
  end if;

  delete from public.standalone_bookings
   where id = '2c41c2ba-5db7-4924-8ac0-8b4cc67cbaf7' and customer_name = 'ff' and custom_experience_title = 'rrrr';
  get diagnostics n_del = row_count;

  update public.standalone_bookings
     set is_cancelled = false,
         cancelled_at = null,
         internal_notes = '[Admin] Annulation posée par erreur lors du nettoyage du 18/09/2026, retirée le 06/10/2026 : la sortie a bien eu lieu.'
   where id = '88119c52-b8d9-4cbc-8078-ecaf9df71eb3' and is_cancelled and status = 'confirmed';
  get diagnostics n_upd = row_count;

  if n_del <> 1 or n_upd <> 1 then
    raise exception 'Résultat inattendu (supprimées: %, corrigées: %), rien n''est modifié', n_del, n_upd;
  end if;
end $$;
