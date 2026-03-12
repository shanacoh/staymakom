-- Enable RLS on storage.objects for experience-images bucket
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