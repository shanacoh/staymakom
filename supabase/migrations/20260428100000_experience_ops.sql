-- Panneau Ops : template de fulfillment par expérience + tickets par réservation

-- Template de fulfillment configuré par l'équipe pour chaque expérience
CREATE TABLE IF NOT EXISTS experience_ops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES experiences2(id) ON DELETE CASCADE,
  providers JSONB NOT NULL DEFAULT '[]'::jsonb,
  fulfillment_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  auto_fulfillment_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(experience_id)
);

COMMENT ON TABLE experience_ops IS 'Template de fulfillment (prestataires + procédure) pour chaque expérience';
COMMENT ON COLUMN experience_ops.providers IS 'Array de { name, type, contact, url, price_range, notes, is_backup }';
COMMENT ON COLUMN experience_ops.fulfillment_steps IS 'Array de { order, label, action_type }';

-- Ticket de traitement créé pour chaque réservation
CREATE TABLE IF NOT EXISTS booking_ops_ticket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  experience_id UUID REFERENCES experiences2(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'failed')),
  steps_status JSONB NOT NULL DEFAULT '{}'::jsonb,
  assigned_provider JSONB,
  confirmation_ref TEXT,
  confirmation_file_url TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE booking_ops_ticket IS 'Ticket de fulfillment opérationnel par réservation';
COMMENT ON COLUMN booking_ops_ticket.steps_status IS 'Map { "step_order": true|false } de l''avancement des étapes';

-- updated_at automatique
CREATE OR REPLACE FUNCTION update_ops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_experience_ops_updated_at
  BEFORE UPDATE ON experience_ops
  FOR EACH ROW EXECUTE FUNCTION update_ops_updated_at();

CREATE OR REPLACE TRIGGER trg_booking_ops_ticket_updated_at
  BEFORE UPDATE ON booking_ops_ticket
  FOR EACH ROW EXECUTE FUNCTION update_ops_updated_at();

-- Trigger : création automatique d'un ticket à chaque nouvelle réservation
-- si l'expérience a un template Ops avec auto_fulfillment_enabled = true
CREATE OR REPLACE FUNCTION auto_create_ops_ticket()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM experience_ops
    WHERE experience_id = NEW.experience_id
      AND auto_fulfillment_enabled = true
  ) THEN
    INSERT INTO booking_ops_ticket (booking_id, experience_id, status)
    VALUES (NEW.id, NEW.experience_id, 'pending');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_auto_create_ops_ticket
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION auto_create_ops_ticket();

-- RLS — admins authentifiés uniquement
ALTER TABLE experience_ops ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_ops_ticket ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'experience_ops' AND policyname = 'Admins manage experience_ops') THEN
    CREATE POLICY "Admins manage experience_ops"
      ON experience_ops FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booking_ops_ticket' AND policyname = 'Admins manage booking_ops_ticket') THEN
    CREATE POLICY "Admins manage booking_ops_ticket"
      ON booking_ops_ticket FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Index
CREATE INDEX IF NOT EXISTS idx_experience_ops_experience ON experience_ops(experience_id);
CREATE INDEX IF NOT EXISTS idx_booking_ops_ticket_booking ON booking_ops_ticket(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_ops_ticket_experience ON booking_ops_ticket(experience_id);
CREATE INDEX IF NOT EXISTS idx_booking_ops_ticket_status ON booking_ops_ticket(status);
