-- Stop anonymous enumeration of the report-images bucket.
--
-- The original policy granted SELECT on storage.objects to `public` (anon +
-- authenticated), which let an anonymous caller list every report's image
-- folders via the storage `list` API. report-images is a PUBLIC bucket, so
-- direct object downloads go through the RLS-bypassing public endpoint
-- (/storage/v1/object/public/report-images/...) and are unaffected by this
-- policy. Scoping SELECT to authenticated users therefore blocks anonymous
-- listing while keeping <img> rendering and the logged-in portal working.
--
-- VERIFY AFTER APPLY: log in to the portal and confirm report images still
-- render, and confirm an anonymous storage `list` on report-images returns
-- nothing.

DROP POLICY IF EXISTS "Anyone can view report images" ON storage.objects;

CREATE POLICY "Authenticated can view report images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'report-images');
