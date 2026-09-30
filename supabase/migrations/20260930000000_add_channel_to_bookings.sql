-- Ajoute le canal d'acquisition (WhatsApp, Instagram, TikTok...) aux réservations
-- manuelles saisies par l'admin, pour pouvoir calculer le CA par canal.
-- Nullable : les réservations existantes n'ont pas de canal connu.

ALTER TABLE public.standalone_bookings
  ADD COLUMN channel TEXT
  CHECK (channel IN ('whatsapp', 'instagram_dm', 'tiktok', 'phone', 'email', 'partner', 'referral', 'walk_in', 'other')),
  ADD COLUMN channel_detail TEXT;

ALTER TABLE public.bookings_hg
  ADD COLUMN channel TEXT
  CHECK (channel IN ('whatsapp', 'instagram_dm', 'tiktok', 'phone', 'email', 'partner', 'referral', 'walk_in', 'other')),
  ADD COLUMN channel_detail TEXT;
