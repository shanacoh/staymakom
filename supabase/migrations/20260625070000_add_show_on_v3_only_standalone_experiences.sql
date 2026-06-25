ALTER TABLE standalone_experiences ADD COLUMN IF NOT EXISTS show_on_v3_only boolean NOT NULL DEFAULT false;
