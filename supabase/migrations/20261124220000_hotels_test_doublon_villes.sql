-- 24/11/2026 (validé par Shana) : appliquée le 24/11/2026.
-- Sauvegarde : backup_20261124.seo_hotels2_status_city
-- 1. Fiches de test et doublon sorties du site, de Google et du llms.txt (passées en brouillon, rien supprimé).
update public.hotels2 set status = 'draft', updated_at = now() where slug = 'shana-test' and status = 'published';
update public.hotels2 set status = 'draft', updated_at = now() where slug = 'moa-living-arava' and status = 'published';
-- 2. Villes erronées (« Be'er Sheva ») corrigées.
update public.hotels2 set city = 'Sde Boker', city_fr = 'Sde Boker', city_he = 'שדה בוקר',
  address = 'Sde Boker, 6329307, Negev, Israel', updated_at = now()
where slug = 'kedma-by-isrotel-design';
update public.hotels2 set city = 'Ein Bokek', city_fr = 'Ein Bokek', city_he = 'עין בוקק',
  address = 'Ein Bokek, Dead Sea, Israel', updated_at = now()
where slug = 'oasis-spa-club-dead-sea-hotel-adults-only';
