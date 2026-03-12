-- Table health_checks for automatic health monitoring
CREATE TABLE IF NOT EXISTS health_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'unhealthy')),
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table alerts for system alerts
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add idempotency_key column to bookings_hg for double-booking protection
ALTER TABLE bookings_hg ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- Enable RLS
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for health_checks
CREATE POLICY "Admins can read health_checks" ON health_checks
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert health_checks" ON health_checks
  FOR INSERT WITH CHECK (true);

-- RLS policies for alerts
CREATE POLICY "Admins can read alerts" ON alerts
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update alerts" ON alerts
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert alerts" ON alerts
  FOR INSERT WITH CHECK (true);