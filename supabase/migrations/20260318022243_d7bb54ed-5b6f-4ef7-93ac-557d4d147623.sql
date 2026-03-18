
-- 1. Alter existing invoices table to add new columns
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'invoice',
  ADD COLUMN IF NOT EXISTS issue_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Set total and balance_due from existing amount for existing rows
UPDATE public.invoices SET total = amount, balance_due = CASE WHEN status = 'paid' THEN 0 ELSE amount END, subtotal = amount WHERE total = 0;

-- 2. Create invoice_line_items table
CREATE TABLE public.invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  item_type text NOT NULL DEFAULT 'service',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their line items" ON public.invoice_line_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM invoices i JOIN properties p ON p.id = i.property_id
    WHERE i.id = invoice_line_items.invoice_id AND p.client_user_id = auth.uid()
  ));

CREATE POLICY "Creators can manage line items" ON public.invoice_line_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

-- 3. Create change_orders table
CREATE TABLE public.change_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their change orders" ON public.change_orders
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM invoices i JOIN properties p ON p.id = i.property_id
    WHERE i.id = change_orders.invoice_id AND p.client_user_id = auth.uid()
  ));

CREATE POLICY "Creators can manage change orders" ON public.change_orders
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

-- 4. Create payments_posted table
CREATE TABLE public.payments_posted (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  method text NOT NULL DEFAULT 'check',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payments_posted ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their payments" ON public.payments_posted
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM invoices i JOIN properties p ON p.id = i.property_id
    WHERE i.id = payments_posted.invoice_id AND p.client_user_id = auth.uid()
  ));

CREATE POLICY "Creators can manage payments" ON public.payments_posted
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'creator'::app_role));

-- 5. Enable realtime on all four tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoice_line_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.change_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments_posted;

-- 6. Auto-generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS integer)), 0) + 1
  INTO next_num
  FROM public.invoices
  WHERE invoice_number IS NOT NULL AND invoice_number LIKE 'HBC-%';
  
  NEW.invoice_number := 'HBC-' || LPAD(next_num::text, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL)
  EXECUTE FUNCTION public.generate_invoice_number();
