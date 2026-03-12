
-- Add thumbnail_image column for listing/card thumbnails
ALTER TABLE experiences2
ADD COLUMN IF NOT EXISTS thumbnail_image text DEFAULT NULL;

COMMENT ON COLUMN experiences2.thumbnail_image IS 'Thumbnail image for listing/card. If NULL, falls back to hero_image';
