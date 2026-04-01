-- Add per-experience ordering to extras and tags junction tables
ALTER TABLE experience2_extras
  ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

ALTER TABLE experience2_highlight_tags
  ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;
