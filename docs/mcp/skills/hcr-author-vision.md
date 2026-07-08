# HCR Author: Vision Projects

Write one vision project page through `upsert_vision_page`. Vision pages
are the aspirational half of the report: what this space could become, why
design comes first, and what the investment looks like when it is real.

## Voice

Warm and aspirational without being a brochure. Paint the morning in the
finished kitchen; do not pitch. Plain language, short paragraphs, no
em-dashes, no urgency tricks. The reader should feel understood, not sold.

## Field-by-field mapping

Envelope: `report_id`, `page_key` ("kitchen-vision-project"), `title`
("Kitchen Vision Project"), `group` (usually "Strategy").

`content`:

- `vision` (required): 1 to 3 short paragraphs of aspirational prose,
  blank line between paragraphs, max 2,400 characters. Ground it in what
  the family actually said they want.
- `whyDesignFirst`: the education paragraph on why the design phase comes
  before demolition: decisions on paper are cheap, decisions mid-build are
  not. Keep it factual and kind.
- `designPhaseWeeks` / `designPhaseCost`: only real numbers from Adam. The
  cost renders as the "Design phase: from $X" line.
- `tiers`: Essential / Enhanced / Signature, all three fully priced with
  real ranges and real scope descriptions, or omitted entirely. Never
  invent a price; an unpriced project shows the tier scaffolding without
  numbers, which is the correct honest state.
- `executionPath`: omit it to use the standard AKR disclosure language.
  Only supply custom text when AKR is not the recommended trade partner;
  then name the recommended partner explicitly instead.
- `priorityWindow` ("Year 1-2") and `category` ("Lifestyle", "Critical",
  "Comfort"): from Adam's sequencing conversation.
- `observations`: current-state bullet findings that motivate the project
  ("Cabinet boxes are sound; faces are dated").

## AKR disclosure (non-negotiable)

AK Renovations is Adam Kilgore's own general contracting company and the
report says so openly; transparency is the brand position. The page always
renders an execution path that names the recommended partner. Never write
copy that hides, softens, or euphemizes the AKR relationship.

## Rules

- Omit unknown fields; they render as "Not yet documented".
- No em-dashes, no numeric scores, no invented facts or prices.
- One page per call; read the result back to Adam before the next.
