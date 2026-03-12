-- Create enum for journal post categories
CREATE TYPE journal_category AS ENUM ('Stories', 'Places', 'Guides', 'People');

-- Create journal_posts table
CREATE TABLE public.journal_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  cover_image TEXT,
  category journal_category NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'STAYMAKOM',
  published_at TIMESTAMP WITH TIME ZONE,
  status hotel_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.journal_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view published articles
CREATE POLICY "Anyone can view published articles"
ON public.journal_posts
FOR SELECT
USING (status = 'published' AND published_at IS NOT NULL);

-- RLS Policy: Admins can manage all articles
CREATE POLICY "Admins can manage all articles"
ON public.journal_posts
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_journal_posts_updated_at
BEFORE UPDATE ON public.journal_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for journal images
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-images', 'journal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for journal images
CREATE POLICY "Anyone can view journal images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'journal-images');

CREATE POLICY "Admins can upload journal images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'journal-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update journal images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'journal-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete journal images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'journal-images' AND has_role(auth.uid(), 'admin'));