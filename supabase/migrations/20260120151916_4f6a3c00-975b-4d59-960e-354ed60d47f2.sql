-- Create highlight_tags table (library of predefined and custom tags)
CREATE TABLE public.highlight_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label_en TEXT NOT NULL,
  label_he TEXT,
  icon TEXT,
  is_common BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.highlight_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view highlight tags"
  ON public.highlight_tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage highlight tags"
  ON public.highlight_tags FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Hotel admins can create custom tags"
  ON public.highlight_tags FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'hotel_admin'::app_role) AND is_common = false);

-- Create experience_highlight_tags junction table
CREATE TABLE public.experience_highlight_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.highlight_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(experience_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.experience_highlight_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view experience tags for published experiences"
  ON public.experience_highlight_tags FOR SELECT
  USING (experience_id IN (
    SELECT id FROM experiences WHERE status = 'published'::hotel_status
  ));

CREATE POLICY "Admins can manage all experience tags"
  ON public.experience_highlight_tags FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Hotel admins can manage their experience tags"
  ON public.experience_highlight_tags FOR ALL
  USING (
    experience_id IN (
      SELECT id FROM experiences WHERE hotel_id = get_user_hotel_id(auth.uid())
    ) AND has_role(auth.uid(), 'hotel_admin'::app_role)
  );

-- Insert predefined common tags
INSERT INTO public.highlight_tags (slug, label_en, label_he, icon, is_common, display_order) VALUES
  ('night', 'Night', 'לילה', 'Moon', true, 1),
  ('breakfast', 'Breakfast', 'ארוחת בוקר', 'Coffee', true, 2),
  ('dinner', 'Dinner', 'ארוחת ערב', 'UtensilsCrossed', true, 3),
  ('massage', 'Massage', 'עיסוי', 'Sparkles', true, 4),
  ('spa-access', 'Spa Access', 'גישה לספא', 'Waves', true, 5),
  ('yoga-class', 'Yoga Class', 'שיעור יוגה', 'Heart', true, 6),
  ('cooking-class', 'Cooking Class', 'סדנת בישול', 'ChefHat', true, 7),
  ('wine-tasting', 'Wine Tasting', 'טעימות יין', 'Wine', true, 8),
  ('tour', 'Tour', 'סיור', 'MapPin', true, 9),
  ('pool', 'Pool', 'בריכה', 'Droplets', true, 10),
  ('gym', 'Gym', 'חדר כושר', 'Dumbbell', true, 11),
  ('wifi', 'WiFi', 'אינטרנט', 'Wifi', true, 12),
  ('parking', 'Parking', 'חניה', 'Car', true, 13),
  ('kids-activities', 'Kids Activities', 'פעילויות לילדים', 'Baby', true, 14),
  ('pet-friendly', 'Pet Friendly', 'ידידותי לחיות מחמד', 'PawPrint', true, 15),
  ('guided-hike', 'Guided Hike', 'טיול מודרך', 'Mountain', true, 16),
  ('meditation', 'Meditation', 'מדיטציה', 'Flower2', true, 17),
  ('couples-treatment', 'Couples Treatment', 'טיפול זוגי', 'HeartHandshake', true, 18),
  ('sunset-drinks', 'Sunset Drinks', 'משקאות שקיעה', 'Sunset', true, 19),
  ('private-chef', 'Private Chef', 'שף פרטי', 'ChefHat', true, 20);

-- Create updated_at trigger
CREATE TRIGGER update_highlight_tags_updated_at
  BEFORE UPDATE ON public.highlight_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();