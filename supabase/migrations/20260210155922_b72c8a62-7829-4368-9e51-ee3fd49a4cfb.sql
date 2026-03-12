
-- Table des extras personnalisés pour Hotel 2
CREATE TABLE IF NOT EXISTS hotel2_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels2(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_he TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ILS',
  pricing_type TEXT NOT NULL DEFAULT 'per_booking',
  image_url TEXT DEFAULT 'Gift',
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotel2_extras_hotel ON hotel2_extras(hotel_id);

ALTER TABLE hotel2_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotel2_extras_select" ON hotel2_extras FOR SELECT USING (true);
CREATE POLICY "hotel2_extras_insert" ON hotel2_extras FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "hotel2_extras_update" ON hotel2_extras FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "hotel2_extras_delete" ON hotel2_extras FOR DELETE USING (auth.role() = 'authenticated');
