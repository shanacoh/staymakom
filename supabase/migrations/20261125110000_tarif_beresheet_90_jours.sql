-- 25/11/2026 (validé par Shana) : appliquée le 25/11/2026.
-- Dégustation de vin au Beresheet : tarif de référence = nuit la moins chère sur les 90 prochains
-- jours (et non plus sur les 30 premières dates), soit 1 436,06 ₪ au lieu de 1 545,65 ₪.
-- Kedma et Galita inchangés (leur minimum sur 90 jours est le même).
update experiences2 set room_net_rate = 1436.06, updated_at = now() where slug = 'wine-tasting-negev-beresheet' and room_net_rate = 1545.65;
