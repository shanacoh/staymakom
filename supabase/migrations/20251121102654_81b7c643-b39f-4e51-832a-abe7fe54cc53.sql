-- Create storage buckets for all image types if they don't exist

-- Hotel images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('hotel-images', 'hotel-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for hotel-images bucket
CREATE POLICY "Anyone can view hotel images"
ON storage.objects FOR SELECT
USING (bucket_id = 'hotel-images');

CREATE POLICY "Admins can upload hotel images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hotel-images' AND
  auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);

CREATE POLICY "Hotel admins can upload their hotel images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hotel-images' AND
  auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'hotel_admin'
  )
);

CREATE POLICY "Admins can update hotel images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hotel-images' AND
  auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can delete hotel images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hotel-images' AND
  auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);