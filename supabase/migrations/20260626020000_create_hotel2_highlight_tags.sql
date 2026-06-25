-- Table de liaison entre hotels2 et highlight_tags
-- Même structure que standalone_experience_highlight_tags et experience2_highlight_tags
-- Les badges éditoriaux de l'hôtel sont gérés ici (position = ordre d'affichage)
CREATE TABLE IF NOT EXISTS hotel2_highlight_tags (
  hotel_id  uuid NOT NULL REFERENCES hotels2(id) ON DELETE CASCADE,
  tag_id    uuid NOT NULL REFERENCES highlight_tags(id) ON DELETE CASCADE,
  position  integer NOT NULL DEFAULT 0,
  PRIMARY KEY (hotel_id, tag_id)
);

CREATE INDEX IF NOT EXISTS hotel2_highlight_tags_hotel_id_idx ON hotel2_highlight_tags(hotel_id);
