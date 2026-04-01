-- Add highlight tag: Art
INSERT INTO highlight_tags (slug, label_en, label_he, is_common, display_order)
VALUES ('art', 'Art', 'אמנות', true, 22)
ON CONFLICT (slug) DO NOTHING;
