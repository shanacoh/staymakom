-- ============================================================
-- Politique RLS "Vitrine" : autoriser la lecture publique
-- des expériences marquées show_on_v3_only=true, même en draft.
-- Ces items sont réservés à la page /vitrine (partage prospects).
-- ============================================================

-- experiences2
CREATE POLICY "Anyone can view vitrine experiences2"
ON public.experiences2 FOR SELECT
TO anon, authenticated
USING (
  show_on_v3_only = true
  AND status != 'archived'::hotel_status
);

-- standalone_experiences
CREATE POLICY "standalone_experiences_vitrine_read"
ON public.standalone_experiences FOR SELECT
TO anon, authenticated
USING (
  show_on_v3_only = true
  AND status != 'archived'
);
