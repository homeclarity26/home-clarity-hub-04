-- Migration 2: Create equipment table with FIXED RLS using has_role()
CREATE TABLE IF NOT EXISTS equipment (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text DEFAULT 'general',
  brand text,
  model text,
  serial_number text,
  install_date date,
  warranty_expiry date,
  last_service_date date,
  next_service_date date,
  estimated_replacement_cost numeric,
  condition text DEFAULT 'unknown',
  notes text,
  report_page_id uuid REFERENCES report_pages(id) ON DELETE SET NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage equipment"
  ON equipment FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Clients can view their equipment"
  ON equipment FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = equipment.property_id
        AND properties.client_user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS equipment_property_id_idx ON equipment(property_id);
CREATE INDEX IF NOT EXISTS equipment_category_idx ON equipment(category);