
-- Saved carts / "Save for later" feature
CREATE TABLE public.saved_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  experience_id uuid REFERENCES public.experiences2(id) ON DELETE CASCADE NOT NULL,
  checkin date,
  checkout date,
  party_size integer DEFAULT 2,
  room_code text,
  room_name text,
  notes text,
  reminder_hours integer DEFAULT 24,
  reminder_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, experience_id)
);

-- Enable RLS
ALTER TABLE public.saved_carts ENABLE ROW LEVEL SECURITY;

-- Users can manage their own saved carts
CREATE POLICY "Users can view their saved carts"
  ON public.saved_carts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create saved carts"
  ON public.saved_carts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their saved carts"
  ON public.saved_carts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved carts"
  ON public.saved_carts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all saved carts"
  ON public.saved_carts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER set_saved_carts_updated_at
  BEFORE UPDATE ON public.saved_carts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
