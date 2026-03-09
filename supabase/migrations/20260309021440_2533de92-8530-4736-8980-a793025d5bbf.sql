-- Create storage bucket for report images
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-images', 'report-images', true);

-- Allow creators to upload images
CREATE POLICY "Creators can upload report images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'report-images' AND
  public.has_role(auth.uid(), 'creator')
);

-- Allow creators to update their uploads
CREATE POLICY "Creators can update report images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'report-images' AND
  public.has_role(auth.uid(), 'creator')
);

-- Allow creators to delete images
CREATE POLICY "Creators can delete report images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'report-images' AND
  public.has_role(auth.uid(), 'creator')
);

-- Anyone can view report images (public bucket)
CREATE POLICY "Anyone can view report images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'report-images');