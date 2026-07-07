-- Idempotency ledger for Stripe webhooks. Stripe retries deliveries on any
-- non-2xx or timeout, so without a dedupe key the same event.id can be
-- processed twice (duplicate invoices / subscription_events rows). The
-- webhook inserts the event id here first; a unique-violation means "already
-- handled" and it returns 200 without reprocessing.

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id     text PRIMARY KEY,
  type         text,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Only the service-role webhook touches this table. Enable RLS with no
-- policies so it is never readable/writable via the anon/authenticated API.
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
