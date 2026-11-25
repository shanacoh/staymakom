-- 25/11/2026 (demandé par Shana) : appliquée le 25/11/2026. Sauvegarde : backup_20261124.ref_rates.
-- Tarif de chambre de référence (prix d'achat HyperGuest le plus bas sur les 30 prochaines
-- dates disponibles, 1 nuit, 2 adultes, petit-déjeuner, même calcul que le back-office)
-- pour les 3 expériences qui n'en avaient pas : sans lui, aucun prix « à partir de » pour les robots.
update experiences2 set room_net_rate = 1545.65, updated_at = now() where slug = 'wine-tasting-negev-beresheet' and room_net_rate is null;
update experiences2 set room_net_rate = 821.45, updated_at = now() where slug = 'jeep-hidden-springs-kedma' and room_net_rate is null;
update experiences2 set room_net_rate = 606.66, updated_at = now() where slug = 'chocolate-workshop-galita-kinneret' and room_net_rate is null;
