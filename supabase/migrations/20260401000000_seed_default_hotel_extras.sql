-- Ajoute les extras par défaut sur tous les hôtels existants qui ne les ont pas encore
-- Un extra est considéré "déjà présent" si le même name existe pour cet hôtel

DO $$
DECLARE
  h RECORD;
  extra RECORD;
  defaults JSONB := '[
    {"name": "Car Transfer Service (one way)", "name_he": "שירות העברה ברכב (כיוון אחד)", "price": 400, "pricing_type": "per_booking", "image_url": "Car"},
    {"name": "Late Check-out",                "name_he": "צ''ק אאוט מאוחר",              "price": 350, "pricing_type": "per_booking", "image_url": "Clock"},
    {"name": "Flower Bouquet",                "name_he": "זר פרחים",                    "price": 180, "pricing_type": "per_booking", "image_url": "Flower2"},
    {"name": "Wine in Room",                  "name_he": "יין בחדר",                    "price": 199, "pricing_type": "per_booking", "image_url": "Wine"},
    {"name": "Card Game",                     "name_he": "משחק קלפים",                  "price": 68,  "pricing_type": "per_booking", "image_url": "Star"},
    {"name": "Digital Camera",               "name_he": "מצלמה דיגיטלית",              "price": 129, "pricing_type": "per_booking", "image_url": "Camera"},
    {"name": "Welcome Snack Basket",          "name_he": "סל קבלת פנים",               "price": 150, "pricing_type": "per_booking", "image_url": "Gift"},
    {"name": "Romantic set up",               "name_he": "עיצוב רומנטי",               "price": 190, "pricing_type": "per_booking", "image_url": "Heart"},
    {"name": "Dinner",                        "name_he": "ארוחת ערב",                   "price": 450, "pricing_type": "per_person",  "image_url": "Utensils"},
    {"name": "Massage",                       "name_he": "עיסוי",                       "price": 450, "pricing_type": "per_person",  "image_url": "Sparkles"}
  ]';
  sort_idx INTEGER;
BEGIN
  FOR h IN SELECT id FROM hotels2 LOOP
    sort_idx := (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM hotel2_extras WHERE hotel_id = h.id);
    FOR extra IN SELECT * FROM jsonb_array_elements(defaults) AS e LOOP
      IF NOT EXISTS (
        SELECT 1 FROM hotel2_extras
        WHERE hotel_id = h.id
        AND name = (extra.value->>'name')
      ) THEN
        INSERT INTO hotel2_extras (hotel_id, name, name_he, price, currency, pricing_type, image_url, is_available, sort_order)
        VALUES (
          h.id,
          extra.value->>'name',
          extra.value->>'name_he',
          (extra.value->>'price')::numeric,
          'ILS',
          extra.value->>'pricing_type',
          extra.value->>'image_url',
          true,
          sort_idx
        );
        sort_idx := sort_idx + 1;
      END IF;
    END LOOP;
  END LOOP;
END $$;
