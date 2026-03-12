-- Create storage bucket for experience images
INSERT INTO storage.buckets (id, name, public)
VALUES ('experience-images', 'experience-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for experience images
CREATE POLICY "Anyone can view experience images"
ON storage.objects FOR SELECT
USING (bucket_id = 'experience-images');

CREATE POLICY "Hotel admins can upload experience images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'experience-images' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.hotel_admins 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Hotel admins can update their experience images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'experience-images'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.hotel_admins 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Hotel admins can delete their experience images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'experience-images'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.hotel_admins 
    WHERE user_id = auth.uid()
  )
);