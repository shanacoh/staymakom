-- experience2_availability_rules
-- Stores availability constraints for experiences:
-- days of week restrictions, date ranges, specific dates, blackout periods

CREATE TABLE IF NOT EXISTS experience2_availability_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experience_id UUID NOT NULL REFERENCES experiences2(id) ON DELETE CASCADE,
  origin TEXT NOT NULL DEFAULT 'experience' CHECK (origin IN ('experience', 'hotel')),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('days_of_week', 'date_range', 'specific_dates', 'blackout')),
  days_of_week INTEGER[],     -- [0..6] 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  date_from DATE,             -- for date_range and blackout
  date_to DATE,               -- for date_range and blackout
  specific_dates DATE[],      -- for specific_dates
  label TEXT,                 -- visitor-facing message (EN)
  label_he TEXT,              -- visitor-facing message (HE)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_availability_rules_experience ON experience2_availability_rules(experience_id);
CREATE INDEX idx_availability_rules_active ON experience2_availability_rules(experience_id, is_active);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_availability_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_availability_rules_updated_at
  BEFORE UPDATE ON experience2_availability_rules
  FOR EACH ROW EXECUTE FUNCTION update_availability_rules_updated_at();

-- RLS
ALTER TABLE experience2_availability_rules ENABLE ROW LEVEL SECURITY;

-- Public: read active rules only
CREATE POLICY "availability_rules_public_read"
  ON experience2_availability_rules
  FOR SELECT
  USING (is_active = true);

-- Admins: full access
CREATE POLICY "availability_rules_admin_all"
  ON experience2_availability_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
