-- =========================================================
-- Migration : ajout des colonnes français (_fr)
-- À exécuter dans le dashboard Supabase > SQL Editor
-- =========================================================

-- TABLE experiences
ALTER TABLE experiences
  ADD COLUMN IF NOT EXISTS title_fr             text,
  ADD COLUMN IF NOT EXISTS subtitle_fr          text,
  ADD COLUMN IF NOT EXISTS long_copy_fr         text,
  ADD COLUMN IF NOT EXISTS duration_fr          text,
  ADD COLUMN IF NOT EXISTS address_fr           text,
  ADD COLUMN IF NOT EXISTS cancellation_policy_fr text,
  ADD COLUMN IF NOT EXISTS accessibility_info_fr text,
  ADD COLUMN IF NOT EXISTS includes_fr          text[],
  ADD COLUMN IF NOT EXISTS not_includes_fr      text[],
  ADD COLUMN IF NOT EXISTS good_to_know_fr      text[],
  ADD COLUMN IF NOT EXISTS services_fr          text[];

-- TABLE experiences2
ALTER TABLE experiences2
  ADD COLUMN IF NOT EXISTS title_fr             text,
  ADD COLUMN IF NOT EXISTS subtitle_fr          text,
  ADD COLUMN IF NOT EXISTS long_copy_fr         text,
  ADD COLUMN IF NOT EXISTS duration_fr          text,
  ADD COLUMN IF NOT EXISTS address_fr           text,
  ADD COLUMN IF NOT EXISTS cancellation_policy_fr text,
  ADD COLUMN IF NOT EXISTS accessibility_info_fr text,
  ADD COLUMN IF NOT EXISTS includes_fr          text[],
  ADD COLUMN IF NOT EXISTS not_includes_fr      text[],
  ADD COLUMN IF NOT EXISTS good_to_know_fr      text[],
  ADD COLUMN IF NOT EXISTS services_fr          text[];

-- TABLE hotels
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS name_fr        text,
  ADD COLUMN IF NOT EXISTS story_fr       text,
  ADD COLUMN IF NOT EXISTS address_fr     text,
  ADD COLUMN IF NOT EXISTS city_fr        text,
  ADD COLUMN IF NOT EXISTS region_fr      text,
  ADD COLUMN IF NOT EXISTS highlights_fr  text[],
  ADD COLUMN IF NOT EXISTS amenities_fr   text[];

-- TABLE hotels2
ALTER TABLE hotels2
  ADD COLUMN IF NOT EXISTS name_fr                 text,
  ADD COLUMN IF NOT EXISTS story_fr                text,
  ADD COLUMN IF NOT EXISTS address_fr              text,
  ADD COLUMN IF NOT EXISTS city_fr                 text,
  ADD COLUMN IF NOT EXISTS region_fr               text,
  ADD COLUMN IF NOT EXISTS highlights_fr           text[],
  ADD COLUMN IF NOT EXISTS amenities_fr            text[],
  ADD COLUMN IF NOT EXISTS description_location_fr text,
  ADD COLUMN IF NOT EXISTS description_room_fr     text;
