-- Add HBC/AKR brand toggle support
-- proposal_color_theme already exists, extending to support 'hbc' and 'akr' values

-- Add brand field to estimates for explicit brand tracking
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS brand text DEFAULT 'hbc';
COMMENT ON COLUMN public.estimates.brand IS 'Which company brand: hbc (Hometown Builders Club) or akr (AK Renovations)';

-- Add proposal_option_prices for three_tier pricing
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS proposal_option_prices jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS proposal_multi_option boolean DEFAULT false;

-- Update existing proposals to use hbc as default brand
UPDATE public.estimates SET brand = 'hbc' WHERE brand IS NULL;
