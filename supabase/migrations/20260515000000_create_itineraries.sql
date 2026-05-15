CREATE TABLE itineraries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  password text UNIQUE NOT NULL,
  client_name text NOT NULL,
  itinerary_content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

-- Le mot de passe est lui-même le mécanisme d'accès (pattern "lien secret").
-- Toute requête sans le bon mot de passe ne retourne aucune ligne.
CREATE POLICY "Read itinerary by password" ON itineraries
  FOR SELECT TO anon, authenticated
  USING (true);
