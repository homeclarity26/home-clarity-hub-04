-- Add admin-uploaded property hero photo. Independent from the Hover scan.
-- This is the front-of-house photo the admin uploads per new client; it powers
-- the portal hero and the report cover page.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS hero_image_url text;

COMMENT ON COLUMN public.properties.hero_image_url IS
  'Front-of-house photo uploaded by the admin during new-client intake. '
  'Powers the client portal hero and the Home Clarity Report cover. '
  'Independent from hover_url (3D scan) and iguide_url (interior tour).';

-- Also create the storage bucket if it doesn't exist, with public-read policies
-- so <img src> works from the portal. Uploads are admin-only (INSERT policy).
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read (so the client can see their own hero). This is fine because
-- hero photos are not sensitive — they are photos of a house exterior.
DROP POLICY IF EXISTS "Public read access to property-photos" ON storage.objects;
CREATE POLICY "Public read access to property-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');

-- Only creators may upload/update/delete (admin role).
DROP POLICY IF EXISTS "Creators manage property-photos" ON storage.objects;
CREATE POLICY "Creators manage property-photos"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'property-photos'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'creator'
    )
  )
  WITH CHECK (
    bucket_id = 'property-photos'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'creator'
    )
  );
