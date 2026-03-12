-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can upload experience images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update experience images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete experience images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view experience images" ON storage.objects;

-- Create policies for experience-images bucket
-- Allow admins to upload experience images
CREATE POLICY "Admins can upload experience images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'experience-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update experience images
CREATE POLICY "Admins can update experience images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'experience-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'experience-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete experience images
CREATE POLICY "Admins can delete experience images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'experience-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow public read access (bucket is already public)
CREATE POLICY "Anyone can view experience images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'experience-images');