-- Enable pgcrypto so gen_random_bytes() resolves.
--
-- Surfaced during Golden Path run on 2026-04-18 step 5.5: inserting into
-- `invoices` failed with 42883 "function gen_random_bytes(integer) does
-- not exist." The `trg_generate_invoice_token` BEFORE INSERT trigger calls
--   encode(gen_random_bytes(16), 'hex')
-- to generate the public invoice-share token. gen_random_bytes is in the
-- pgcrypto extension, which was never enabled on this project, meaning
-- every single invoice insert — via the admin UI, via
-- ai-invoice-assistant, via the hbc-agent create_invoice tool — was
-- failing silently in prod.
--
-- pgcrypto is maintained by the Postgres core team and is safe to enable
-- on Supabase (it's on their "supported extensions" allowlist).

CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- The existing `generate_invoice_token` trigger function calls bare
-- `gen_random_bytes()` but Supabase installs pgcrypto in the `extensions`
-- schema, which isn't on the function's search_path. Widen the search
-- path + fully qualify the call so it resolves regardless of caller.
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
