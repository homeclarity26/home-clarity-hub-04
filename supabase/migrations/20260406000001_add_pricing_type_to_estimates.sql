-- Step 3C: Add pricing_type and related columns to estimates table
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS pricing_type text DEFAULT 'lump_sum';
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS hourly_rate numeric;
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS estimated_hours numeric;
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS materials_estimate numeric;

-- Add comment for documentation
COMMENT ON COLUMN public.estimates.pricing_type IS 'One of: labor_only, lump_sum, three_tier, allowance, time_and_materials';
COMMENT ON COLUMN public.estimates.hourly_rate IS 'For time_and_materials pricing type: hourly labor rate';
COMMENT ON COLUMN public.estimates.estimated_hours IS 'For time_and_materials pricing type: estimated hours to complete';
COMMENT ON COLUMN public.estimates.materials_estimate IS 'For time_and_materials pricing type: estimated materials cost';
