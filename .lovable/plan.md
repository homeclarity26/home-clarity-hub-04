

# Pre-Launch Fix Plan — Items 1 through 9

## Item 1: Fix RLS Security Vulnerabilities (Critical)

The security scan found 41 findings. The work breaks into three sub-tasks:

### 1a. Remove anon access to financial data
Drop anon SELECT policies on `invoices`, `invoice_line_items`, `estimates`, `estimate_line_items`, and `home_value_snapshots`. The token-based anon UPDATE policies on `invoices` and `estimates` (for tracking views) are acceptable — only the broad SELECT exposure is the issue.

**Why token-based reads can't just be removed:** Clients receive proposal/invoice links with tokens. Solution: create two SECURITY DEFINER functions (`get_invoice_by_token` and `get_estimate_by_token`) that accept a token, return only the fields needed for the payment/response flow, and are callable by anon. Drop the broad anon SELECT policies.

### 1b. Lock down 19 tables with `USING (true)` on write/all operations
These tables currently let any authenticated user read/write all rows. Each needs ownership-based policies using `has_role()` for creators and property-ownership joins for clients:

| Table | Ownership Path |
|-------|---------------|
| `annual_reviews` | `property_id → properties.client_user_id` |
| `project_scopes` | `project_id → projects.property_id → properties.client_user_id` |
| `voice_interactions` | `user_id` directly |
| `permit_registry` | `property_id → properties.client_user_id` |
| `service_history` | `equipment_id → equipment.property_id → properties.client_user_id` |
| `document_extractions` | `document_id → documents.property_id → properties.client_user_id` |
| `warranty_registry` | `property_id → properties.client_user_id` |
| `structural_specifications` | `property_id → properties.client_user_id` |
| `home_knowledge_base` | `property_id → properties.client_user_id` |
| `property_timeline` | `property_id → properties.client_user_id` |
| `scheduled_reports` | creator-only (use `has_role`) |
| `export_jobs` | `user_id` directly |
| `photo_analyses` | `photo_id → report_photos/property_photos → property_id` |
| `referral_events` | `referral_code_id → referral_codes.property_id` |
| `referral_credits` | `property_id → properties.client_user_id` |
| `cross_client_insights` | creator-only read |
| `ai_notification_nudges` | `client_id` = user or creator |
| `push_notification_log` | creator-only insert |
| `home_value_snapshots` | `property_id → properties.client_user_id` |

**Pattern for each:** Drop the permissive policy, replace with:
- Creators can do everything: `USING (has_role(auth.uid(), 'creator'))`
- Clients can read their own: `USING (property_id IN (SELECT id FROM properties WHERE client_user_id = auth.uid()))` (adjusted per ownership path)

This will be a single large migration with ~60 policy statements.

### 1c. Create helper functions for ownership checks
To avoid repetition and recursion, create 1-2 SECURITY DEFINER functions:
- `owns_property(uuid)` — returns true if `auth.uid()` is the `client_user_id` of that property
- `is_creator()` — shorthand for `has_role(auth.uid(), 'creator')`

---

## Item 2: Add Stripe Secrets

**Requires your input.** I will prompt you to enter `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` using the secrets tool. No code changes needed — the edge functions already reference these env vars.

---

## Item 3: Enable Leaked Password Protection

Use the `configure_auth` tool to enable `leaked_password_protection`. Single setting change.

---

## Item 4: Remove Dev Auth Bypass Code

Delete lines 30-61 from `AuthContext.tsx` (the `DEV_BYPASS_AUTH` constant, `MOCK_USER`, `MOCK_SESSION`, `MOCK_PROFILE`). Update the state initializers on lines 72-76 to remove the ternary checks that reference `DEV_BYPASS_AUTH`. Also remove the early return on line 103.

**1 file changed:** `src/contexts/AuthContext.tsx`

---

## Item 5: Fix forwardRef Console Warning

Search for the component triggering the warning in `ClientAgentPanel` and its child components. The warning typically comes from passing a ref through a component that doesn't use `forwardRef`. Will inspect and fix the specific component.

*(Note: initial search found no `forwardRef` usage — the warning likely comes from a library component like Radix UI's Sheet/ScrollArea receiving a ref. Will trace the exact source during implementation.)*

---

## Item 6: Set Up Custom Domain + Branded Email

**Requires your input.** I'll guide you through:
1. Connecting your custom domain in project Settings → Domains
2. Setting up an email sending domain via the email setup dialog

No code changes — configuration only.

---

## Item 7: Add PWA Icons

Generate proper 192x192 and 512x512 PNG icons and update `manifest.json` to reference them. Also add `<link rel="apple-touch-icon">` to `index.html`.

**Files changed:** `public/manifest.json`, `index.html`, plus 2 new icon files.

---

## Item 8: Add OG Meta Tags

Add `og:image`, `og:url`, and `twitter:image` meta tags to `index.html`. Create or reference a 1200x630 OG image.

**1 file changed:** `index.html`

---

## Item 9: Add Error Monitoring

Add a lightweight global error handler that logs uncaught errors and unhandled promise rejections. Options:
- **Minimal (no dependency):** Add `window.onerror` and `window.onunhandledrejection` handlers in `main.tsx` that log to the `activity_log` table or console
- **If you want a service:** I can integrate Sentry (requires adding the dependency and a DSN secret)

I'll implement the minimal approach unless you prefer Sentry.

**1 file changed:** `src/main.tsx`

---

## Execution Order

| Step | Item | Blocking? |
|------|------|-----------|
| 1 | #4 Remove dev bypass | No dependencies |
| 2 | #1 RLS migration (single large migration) | No dependencies |
| 3 | #3 Enable leaked password protection | No dependencies |
| 4 | #5 Fix forwardRef warning | No dependencies |
| 5 | #7 PWA icons + #8 OG tags | No dependencies |
| 6 | #9 Error monitoring | No dependencies |
| 7 | #2 Stripe secrets | Needs your input |
| 8 | #6 Custom domain + email | Needs your input |

Steps 1-6 can be done without any input from you. Steps 7-8 require you to provide credentials/domain info.

