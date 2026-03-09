
-- Create vendors table for approved vendor partners per property
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  title text NOT NULL,
  contact_name text,
  email text,
  phone text,
  specialty text NOT NULL DEFAULT 'General',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Creators can manage vendors
CREATE POLICY "Creators can manage vendors"
  ON public.vendors FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

-- Clients can view vendors for their properties
CREATE POLICY "Clients can view their vendors"
  ON public.vendors FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = vendors.property_id
    AND properties.client_user_id = auth.uid()
  ));

-- Add iguide_url column to properties metadata (or as a direct column)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS iguide_url text;

-- Add service_region to profiles for admin settings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS service_region text DEFAULT 'Summit County, OH';
