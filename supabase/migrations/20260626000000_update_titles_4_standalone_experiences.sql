-- Mise à jour des titres de 4 expériences standalone (EN, FR, HE)
-- Source : nouveaux_titres_4_experiences.md
-- Note : les titres hébreux n'ont pas encore été validés par un natif — à faire relire avant publication.

UPDATE public.standalone_experiences
SET
  title    = 'GENERATIONS OF VINES',
  title_fr = 'VIGNOBLE EN FAMILLE',
  title_he = 'כרם המשפחה'
WHERE slug = 'family-winery-wine-tasting-zichron-yaakov';

UPDATE public.standalone_experiences
SET
  title    = 'HORSES ARE FAMILY',
  title_fr = 'AU GALOP',
  title_he = 'בדהרה'
WHERE slug = 'balade-cheval-lev-hateva';

UPDATE public.standalone_experiences
SET
  title    = 'DESERT SUNSET FOR TWO',
  title_fr = 'COUCHER DE SOLEIL À DEUX',
  title_he = 'שקיעה לשניים'
WHERE slug = 'sunset-jeep-mount-yoash-eilat';

UPDATE public.standalone_experiences
SET
  title    = 'TIPSY IN THE NEGEV',
  title_fr = 'VIN DU NÉGUEV',
  title_he = 'יין מהנגב'
WHERE slug = 'desert-winery-tasting-mitzpe-ramon';
