-- Complementary to 20260418030000_enable_pgcrypto.sql.
--
-- That earlier migration already ran on prod (NOTICE: "extension pgcrypto
-- already exists") but didn't re-create the `generate_invoice_token`
-- trigger function, so the function body still referenced bare
-- `gen_random_bytes(16)` which fails because pgcrypto is in the
-- `extensions` schema, not `public`. This migration replaces the function
-- with a fully-qualified call + widened search_path.
--
-- Effect: INSERTs into public.invoices no longer error with
-- "function gen_random_bytes(integer) does not exist".

CREATE OR REPLACE FUNCTION public.generate_invoice_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $func$
BEGIN
  IF NEW.invoice_token IS NULL THEN
    NEW.invoice_token := encode(extensions.gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$func$;
