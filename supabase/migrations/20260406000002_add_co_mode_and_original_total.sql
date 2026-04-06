-- Add co_mode to change_orders and original_total/co_total to invoices
ALTER TABLE public.change_orders ADD COLUMN IF NOT EXISTS co_mode text DEFAULT 'formal';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS original_total numeric;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS co_total numeric DEFAULT 0;

-- Set original_total for existing invoices where it hasn't been set yet
UPDATE public.invoices SET original_total = total WHERE original_total IS NULL;
