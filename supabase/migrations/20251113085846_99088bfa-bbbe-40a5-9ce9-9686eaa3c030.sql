-- Create gift_cards table for managing gift card purchases and redemptions
CREATE TABLE public.gift_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('amount', 'experience')),
  amount NUMERIC,
  currency TEXT DEFAULT 'ILS',
  experience_id UUID REFERENCES public.experiences(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  message TEXT,
  delivery_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '12 months'),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  booking_id UUID REFERENCES public.bookings(id),
  stripe_payment_intent_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on gift_cards
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- Revoke default grants
REVOKE ALL ON public.gift_cards FROM PUBLIC;
REVOKE ALL ON public.gift_cards FROM anon;
REVOKE ALL ON public.gift_cards FROM authenticated;

-- Anyone can create gift cards (purchase without login)
CREATE POLICY "Anyone can create gift cards"
ON public.gift_cards
FOR INSERT
WITH CHECK (true);

-- Admins can manage all gift cards
CREATE POLICY "Admins can manage all gift cards"
ON public.gift_cards
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_gift_cards_updated_at
BEFORE UPDATE ON public.gift_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_gift_cards_code ON public.gift_cards(code);
CREATE INDEX idx_gift_cards_status ON public.gift_cards(status);
CREATE INDEX idx_gift_cards_recipient_email ON public.gift_cards(recipient_email);
CREATE INDEX idx_gift_cards_expires_at ON public.gift_cards(expires_at);