-- Fix: Alderwood demo report pages were seeded (before commit abc694f) with
-- Unsplash stock imagery; the static demo file was updated but the rows
-- already existed in prod so the seed script's "skip if exists" guard made
-- subsequent re-runs no-ops. The live portal renders images from
-- report_pages.images (see src/hooks/useClientPortal.ts#312 → pageImages),
-- so until those rows are updated, the wrong images keep showing.
--
-- This migration rewrites report_pages.images for every demo property
-- (properties.metadata->>'demo' = 'true') on a per-page_key basis, matching
-- the mapping approved on 2026-04-23 in workspace/alderwood_image_page_map.md
-- and encoded in scripts/_demo-data/home-alderwood.mjs.
--
-- Scope is narrow — only demo properties, only the images column, only the
-- Alderwood page_keys. Safe to re-run.

UPDATE report_pages rp
SET images = CASE rp.page_key
  WHEN 'executive-summary'  THEN to_jsonb(ARRAY[
    '/demo/alderwood/ChatGPT-Image-Apr-23-2026-07_47_16-AM.jpg',
    '/demo/alderwood/ChatGPT-Image-Apr-23-2026-08_04_54-AM.jpg',
    '/demo/alderwood/ChatGPT-Image-Apr-23-2026-07_58_28-AM.jpg'
  ])
  WHEN 'roof-system'        THEN to_jsonb(ARRAY['/demo/alderwood/ChatGPT-Image-Apr-23-2026-07_50_55-AM.jpg'])
  WHEN 'siding-cladding'    THEN to_jsonb(ARRAY[
    '/demo/alderwood/ChatGPT-Image-Apr-23-2026-07_54_18-AM.jpg',
    '/demo/alderwood/ChatGPT-Image-Apr-23-2026-07_58_28-AM.jpg'
  ])
  -- Windows: no dedicated shot — trim/window detail then interior transition.
  WHEN 'windows'            THEN to_jsonb(ARRAY[
    '/demo/alderwood/ChatGPT-Image-Apr-23-2026-07_54_18-AM.jpg',
    '/demo/alderwood/ChatGPT-Image-Apr-23-2026-08_08_08-AM.jpg'
  ])
  WHEN 'kitchen'            THEN to_jsonb(ARRAY['/demo/alderwood/ChatGPT-Image-Apr-23-2026-07_55_19-AM.jpg'])
  WHEN 'primary-bedroom'    THEN to_jsonb(ARRAY['/demo/alderwood/ChatGPT-Image-Apr-23-2026-07_57_22-AM.jpg'])
  WHEN 'primary-furnace'    THEN to_jsonb(ARRAY['/demo/alderwood/ChatGPT-Image-Apr-23-2026-08_00_44-AM.jpg'])
  WHEN 'electrical-system'  THEN to_jsonb(ARRAY['/demo/alderwood/ChatGPT-Image-Apr-23-2026-08_02_07-AM.jpg'])
  -- Plumbing: no dedicated shot — mechanical room has visible piping.
  WHEN 'plumbing-system'    THEN to_jsonb(ARRAY['/demo/alderwood/ChatGPT-Image-Apr-23-2026-08_00_44-AM.jpg'])
  WHEN 'basement'           THEN to_jsonb(ARRAY['/demo/alderwood/ChatGPT-Image-Apr-23-2026-08_04_11-AM.jpg'])
  -- Strategic roadmap: elegant exterior golden-hour until bespoke graphic.
  WHEN 'strategic-roadmap'  THEN to_jsonb(ARRAY['/demo/alderwood/ChatGPT-Image-Apr-23-2026-08_04_54-AM.jpg'])
  -- Safety: no dedicated shot — interior transition.
  WHEN 'safety-detection'   THEN to_jsonb(ARRAY['/demo/alderwood/ChatGPT-Image-Apr-23-2026-08_08_08-AM.jpg'])
  ELSE rp.images
END
FROM reports r
JOIN properties p ON p.id = r.property_id
WHERE rp.report_id = r.id
  AND (p.metadata->>'demo')::boolean IS TRUE
  AND p.property_name LIKE '[DEMO] Alderwood%'
  AND rp.page_key IN (
    'executive-summary','roof-system','siding-cladding','windows',
    'kitchen','primary-bedroom','primary-furnace','electrical-system',
    'plumbing-system','basement','strategic-roadmap','safety-detection'
  );
