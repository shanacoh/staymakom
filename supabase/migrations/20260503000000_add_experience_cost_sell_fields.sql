ALTER TABLE experiences2
  ADD COLUMN IF NOT EXISTS experience_cost_fixed      NUMERIC,
  ADD COLUMN IF NOT EXISTS experience_cost_per_person NUMERIC,
  ADD COLUMN IF NOT EXISTS experience_sell_fixed      NUMERIC,
  ADD COLUMN IF NOT EXISTS experience_sell_per_person NUMERIC;
