-- Copie les badges experience2_highlight_tags vers hotel2_highlight_tags
-- en utilisant l'hôtel primaire (position la plus basse dans experience2_hotels)
-- Migration one-shot : les badges passent du niveau expérience au niveau hôtel
INSERT INTO hotel2_highlight_tags (hotel_id, tag_id, position)
SELECT DISTINCT ON (primary_hotel.hotel_id, eht.tag_id)
  primary_hotel.hotel_id,
  eht.tag_id,
  eht.position
FROM experience2_highlight_tags eht
JOIN (
  SELECT DISTINCT ON (experience_id)
    experience_id,
    hotel_id
  FROM experience2_hotels
  ORDER BY experience_id, position ASC
) primary_hotel ON primary_hotel.experience_id = eht.experience_id
ON CONFLICT (hotel_id, tag_id) DO NOTHING;
