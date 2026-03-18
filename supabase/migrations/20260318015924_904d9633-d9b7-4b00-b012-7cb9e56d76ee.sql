-- Migration 3: Add report_page_key to vendors
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS report_page_key text;
CREATE INDEX IF NOT EXISTS vendors_report_page_key_idx ON vendors(report_page_key);
CREATE INDEX IF NOT EXISTS vendors_property_page_idx ON vendors(property_id, report_page_key);