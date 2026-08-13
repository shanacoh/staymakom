-- Nouvelle fiche Bateaux : Catamaran Tel Aviv — prestataire B.OZ.
-- Contenu transmis par Shana (captures du site prestataire, en hébreu) le
-- 2026-08-13, complété avec ses réponses de clarification :
-- - Prix reçus (2100₪/2h, 2900₪/3h) = prix fournisseur, marge de 30%
--   appliquée dessus (même règle que le reste de la catégorie Bateaux).
-- - Modélisé comme un forfait de base 2h + un extra "prolonger à 3h"
--   (delta fournisseur 800₪ -> 1040₪ client après marge), même principe
--   que les fiches Seamona.
-- - Prestataire : B.OZ, contact = lien produit transmis par Shana.
-- - Volontairement aucune politique d'annulation renseignée (Shana : "ne
--   mets pas") — le texte du lien "תנאי ביטול" du prestataire n'a pas été
--   fourni, à compléter plus tard si besoin.
-- - status = 'draft' + show_on_v3_only = TRUE : à valider par Shana
--   (photos, description) avant publication.

DO $$
DECLARE
  cat_bateaux UUID;
  exp_id      UUID;
BEGIN
  SELECT id INTO cat_bateaux FROM public.categories WHERE slug = 'bateaux' LIMIT 1;

  exp_id := gen_random_uuid();
  INSERT INTO public.standalone_experiences (
    id, slug, status, show_on_v3_only, display_order,
    title, title_fr,
    subtitle, subtitle_fr,
    long_copy, long_copy_fr,
    duration, duration_fr,
    category_id,
    supplier_name, supplier_contact,
    supplier_price_adult, markup_percent, base_price, base_price_type, currency,
    max_party, lead_time_days,
    city, city_fr, region, region_fr
  ) VALUES (
    exp_id, 'catamaran-tel-aviv', 'draft', TRUE, 12,
    $t$Catamaran Tel Aviv$t$, $t$Catamaran Tel Aviv$t$,
    $t$A new-model catamaran yacht cruise in Tel Aviv for up to 14 guests, with a light buffet included.$t$,
    $t$Une croisière en catamaran nouvelle génération à Tel-Aviv, jusqu'à 14 personnes, buffet léger inclus.$t$,
    $t$<p>A luxury catamaran yacht for rent in Tel Aviv. This new-model catamaran offers a unique sailing experience for groups of up to 14 people, in comfort and style, with an upper deck, a premium sound system, a kitchen and restrooms on board.</p><p>Celebrate a range of occasions with us: romantic sails, marriage proposals, bachelor and bachelorette parties, dance parties, birthdays and more. A "Mazal Tov" sign can be added on request. Guests are welcome to bring their own food and drinks, and a security deposit is required for guests over 16.</p>$t$,
    $t$<p>Un catamaran de luxe à louer à Tel-Aviv. Ce nouveau modèle de catamaran offre une expérience de navigation unique pour des groupes allant jusqu'à 14 personnes, dans le confort et la convivialité, avec un pont supérieur, une sonorisation premium, une cuisine et des toilettes à bord.</p><p>Célébrez avec nous différents événements : sortie romantique, demande en mariage, enterrement de vie de garçon ou de jeune fille, soirée dansante, anniversaire et plus encore. Une pancarte "Mazal Tov" peut être ajoutée sur demande. Vous pouvez apporter votre propre nourriture et boissons ; une caution est demandée pour les invités de plus de 16 ans.</p>$t$,
    $t$2 to 3 hours$t$, $t$2h à 3h$t$,
    cat_bateaux,
    'B.OZ', 'https://www.b-oz.co.il/product/%D7%94%D7%A4%D7%9C%D7%92%D7%94-%D7%91%D7%99%D7%90%D7%9B%D7%98%D7%AA-%D7%A7%D7%98%D7%9E%D7%A8%D7%9F-%D7%A2%D7%93-14-%D7%90%D7%99%D7%A9-%D7%AA%D7%9C-%D7%90%D7%91%D7%99%D7%91/',
    2100, 30, 2730.00, 'fixed', 'ILS',
    14, 2,
    'Tel Aviv', 'Tel Aviv', 'Sea outing', 'Sortie en mer'
  );

  INSERT INTO public.standalone_extras (experience_id, title, title_fr, price, sort_order) VALUES
    (exp_id, $t$Extend to 3 hours total$t$, $t$Prolonger à 3h au total$t$, 1040, 0);

  INSERT INTO public.standalone_experience_includes (experience_id, title, title_fr, order_index) VALUES
    (exp_id, $t$Light buffet included$t$, $t$Buffet léger inclus$t$, 0),
    (exp_id, $t$Water and refreshments$t$, $t$Eau et rafraîchissements$t$, 1),
    (exp_id, $t$Premium sound system$t$, $t$Sonorisation premium$t$, 2),
    (exp_id, $t$Kitchen and restrooms onboard$t$, $t$Cuisine et toilettes à bord$t$, 3),
    (exp_id, $t$"Mazal Tov" sign on request$t$, $t$Pancarte "Mazal Tov" sur demande$t$, 4);

END $$;
