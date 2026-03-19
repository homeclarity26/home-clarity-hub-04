
-- Digital Twin Tables

CREATE TABLE public.document_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid,
  client_id uuid NOT NULL,
  extraction_status text NOT NULL DEFAULT 'pending',
  document_type text DEFAULT 'other',
  confidence_score numeric,
  raw_extracted_text text,
  structured_data jsonb DEFAULT '{}'::jsonb,
  equipment_ids_created jsonb DEFAULT '[]'::jsonb,
  findings_created jsonb DEFAULT '[]'::jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.home_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  knowledge_type text NOT NULL DEFAULT 'fact',
  subject text NOT NULL,
  content text NOT NULL,
  source_document_id uuid,
  source_type text NOT NULL DEFAULT 'manual_entry',
  confidence text NOT NULL DEFAULT 'medium',
  date_recorded timestamptz NOT NULL DEFAULT now(),
  date_of_fact timestamptz,
  is_current boolean NOT NULL DEFAULT true,
  superseded_by_id uuid REFERENCES public.home_knowledge_base(id),
  tags jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.property_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  event_date date NOT NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  cost numeric,
  contractor_name text,
  permit_number text,
  source_document_id uuid,
  created_by text NOT NULL DEFAULT 'admin',
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.structural_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  spec_category text NOT NULL,
  specification_name text NOT NULL,
  specification_value text NOT NULL,
  unit text,
  notes text,
  source_document_id uuid,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.warranty_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  equipment_id uuid,
  item_name text NOT NULL,
  manufacturer text,
  model_number text,
  serial_number text,
  purchase_date date,
  warranty_type text DEFAULT 'manufacturer',
  warranty_duration_months integer,
  expiration_date date,
  coverage_description text,
  claim_process text,
  support_phone text,
  support_email text,
  support_url text,
  document_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.permit_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  permit_number text,
  permit_type text,
  description text,
  issue_date date,
  expiration_date date,
  issued_by text,
  contractor_name text,
  estimated_cost numeric,
  final_cost numeric,
  status text NOT NULL DEFAULT 'open',
  inspection_dates jsonb DEFAULT '[]'::jsonb,
  document_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.service_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  equipment_id uuid,
  service_date date NOT NULL,
  service_type text NOT NULL,
  description text,
  contractor_name text,
  contractor_phone text,
  cost numeric,
  invoice_number text,
  warranty_on_work_months integer,
  next_service_recommended_date date,
  notes text,
  document_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.structural_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_history ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated can read/write all (admin manages, clients read own)
CREATE POLICY "Authenticated users can manage document_extractions" ON public.document_extractions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage home_knowledge_base" ON public.home_knowledge_base FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage property_timeline" ON public.property_timeline FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage structural_specifications" ON public.structural_specifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage warranty_registry" ON public.warranty_registry FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage permit_registry" ON public.permit_registry FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage service_history" ON public.service_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_doc_extractions_client ON public.document_extractions(client_id);
CREATE INDEX idx_knowledge_base_client ON public.home_knowledge_base(client_id);
CREATE INDEX idx_property_timeline_client ON public.property_timeline(client_id);
CREATE INDEX idx_structural_specs_client ON public.structural_specifications(client_id);
CREATE INDEX idx_warranty_registry_client ON public.warranty_registry(client_id);
CREATE INDEX idx_permit_registry_client ON public.permit_registry(client_id);
CREATE INDEX idx_service_history_client ON public.service_history(client_id);
CREATE INDEX idx_knowledge_base_subject ON public.home_knowledge_base(subject);
CREATE INDEX idx_property_timeline_date ON public.property_timeline(event_date);
