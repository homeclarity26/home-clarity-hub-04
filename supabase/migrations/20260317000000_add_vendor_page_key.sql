-- Add report_page_key to vendors table for page-level vendor recommendations
-- This allows vendors to be assigned to specific report pages so clients can see
-- recommended vendors directly within each section of their home report.

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS report_page_key text;

CREATE INDEX IF NOT EXISTS vendors_report_page_key_idx ON vendors(report_page_key);
CREATE INDEX IF NOT EXISTS vendors_property_page_idx ON vendors(property_id, report_page_key);
