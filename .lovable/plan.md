

# Polished Proposal Output — Redesign Plan

## The Gap

Your current proposal system produces an **interactive web page** (`/proposal/:token`) with scroll animations and theme colors. That works for online viewing, but you also need **print-quality .docx downloads** that look as polished as your AK Renovations proposals — locked layout, branded cover, structured scope sections with sidebar numbering, client selections table, investment box, and terms grid.

Your AK system uses a `docx-js` template script that produces pixel-perfect documents every time. The HBC proposal system currently has no .docx export at all.

## What Gets Built

### 1. Proposal DOCX Template Engine

A reusable `docx-js` template script (run via edge function) that generates branded .docx proposals from the data already stored in the `estimates` table. The template will be **locked** — same design every time, only the data changes.

**Document structure (matching your AK quality standard):**

```text
Page 1  — Full-bleed cover (brand color background, company name,
           project title, client name, address, date)
Page 2  — Overview (project summary paragraph, total price box)
Page 3+ — Scope sections (numbered: Section 01, 02... with
           sidebar layout, bold-label bullet points, accent rule dividers)
Page N  — Client Selections / Shopping List (category rows with
           item name, description, where to shop)
Page N+1— Investment summary (base price box, optional add-ons,
           grand total)
Page N+2— Timeline (phase table or cards)
Page N+3— Terms & Conditions (2-column grid)
Page N+4— Next Steps / CTA
Footer  — Company phone + website on every page
```

### 2. Proposal Data Model Upgrade

Add structured scope sections and client selections to the estimates table (JSONB columns):

- `proposal_scope_sections` — array of `{ number, title, bullets: [{ label, desc }] }` (matching your AK format exactly)
- `proposal_client_selections` — array of `{ label, items: [{ name, desc, shop }] }`
- `proposal_terms` — array of `{ label, value }` for the terms grid
- `proposal_multi_option` — boolean flag + `proposal_option_prices` JSONB for multi-option proposals

### 3. Scope Section Builder in ProposalBuilder UI

Replace the current single "Plain Language Description" textarea with a **structured scope section editor**:

- Add/remove/reorder numbered sections (Section 01, 02...)
- Each section has a title and bullet points (bold label + description)
- AI "Auto-Generate Scope" button that takes the project type + line items and produces structured sections following your frameworks (Bathroom: Site Prep → Demo → Rough-In → ..., Kitchen: ..., etc.)
- Project type selector that pre-loads the standard section framework

### 4. Client Selections / Shopping List Builder

New accordion section in ProposalBuilder for items the client selects and buys separately:

- Category groups (e.g., "SHOWER", "VANITY", "FLOORING")
- Each item: name, what to look for, where to shop
- AI "Suggest Selections" button based on project type

### 5. Multi-Option Support

When the proposal has multiple build options (e.g., screened porch vs. enclosed room):

- Toggle "Multi-Option Proposal" in the builder
- Each option gets its own scope section + price
- Total displays "See Options Below" instead of a single number
- Comparison summary section auto-generated

### 6. DOCX Download Button + Edge Function

- "Download .docx" button in ProposalBuilder (next to Preview and Copy Link)
- Calls a `generate-proposal-docx` edge function
- Edge function uses `docx-js` to render the locked template with the estimate data
- Returns the .docx file as a download
- The web proposal (`/proposal/:token`) also gets a download button so clients can save a copy

### 7. Invoice DOCX (Same Engine)

The same template engine produces invoice .docx files:

- Pulls line items, payment terms, and client data from the invoice record
- If linked to a proposal, inherits scope and client selections
- Clean, branded layout matching the proposal style

## How the AI Wizard Connects

The Q&A wizard (from the previously approved plan) feeds directly into these structured fields. When the wizard completes:

1. AI maps answers → `proposal_scope_sections` (structured sections with numbered phases)
2. AI maps answers → `proposal_client_selections` (shopping list)
3. AI maps answers → timeline, pricing, terms
4. All fields auto-populate in ProposalBuilder
5. One click generates the .docx

## Implementation Order

| Step | What | 
|------|------|
| 1 | Migration: add `proposal_scope_sections`, `proposal_client_selections`, `proposal_terms`, `proposal_option_prices` JSONB columns to estimates |
| 2 | Scope Section Builder UI in ProposalBuilder (numbered sections + bullets + AI generate) |
| 3 | Client Selections Builder UI (categories + items + AI suggest) |
| 4 | Terms editor (2-column key/value pairs) |
| 5 | `generate-proposal-docx` edge function with locked docx-js template |
| 6 | Download buttons in ProposalBuilder + ProposalView |
| 7 | Multi-option support (toggle + per-option pricing) |
| 8 | Invoice .docx generation using same engine |
| 9 | Update ProposalView web page to render structured scope sections instead of flat line items |

## Brand Customization

The .docx template will read from the admin's brand settings (already stored):
- Company name, phone, website
- Brand colors (mapped from the 5 theme swatches to docx color values)
- Logo (if uploaded)

The design is locked — admins choose a theme, the template handles the rest. No manual formatting.

