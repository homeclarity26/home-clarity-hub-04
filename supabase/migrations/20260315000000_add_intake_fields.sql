-- Add intake and digital asset fields to properties table for Stage 1

ALTER TABLE properties ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS zip text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS county text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS relationship_type text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS hover_url text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS hover_pdf_url text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS iguide_pdf_url text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS client_intelligence_summary text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS discovery_notes text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS intake_status text DEFAULT 'draft';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS digital_assets_status text DEFAULT 'not_started';
