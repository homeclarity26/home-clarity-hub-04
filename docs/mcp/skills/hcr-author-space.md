# HCR Author: Spaces

Write one interior or exterior space page through `upsert_room_page`. One
page per call, reviewed in conversation before the next.

## Voice

Adam's voice is a warm expert walking a friend through their own home:
plain language, specific, unhurried, never salesy and never alarmist. Say
"the carpet is worn where the morning traffic goes" not "flooring exhibits
wear patterns". Short sentences beat long ones. No em-dashes, ever; use a
comma or a semicolon. No numeric scores of any kind.

## Field-by-field mapping

Envelope: `report_id`, `page_key` (kebab-case), `title` ("Primary Suite"),
`group` ("Interior Spaces" or "Exterior Spaces").

`content`:

- `narrative`: 1 to 3 short paragraphs separated by blank lines. This is
  the warm walkthrough prose: what the room is, how it lives, what stands
  out. Max 2,400 characters total; aim for far less.
- `dims` ("14 x 16"), `floorSqft`, `ceiling` ("9ft tray"), `floorLevel`
  ("Main Floor"): the metadata strip. Only what was actually measured or
  observed.
- `finishes.wallPaint / trimPaint / ceilingPaint / flooring`: exact product
  or color names when known ("SW 7029 Agreeable Gray"). These are the
  fields the family comes back to years later.
- `fixtures.lighting / outlets / windows / doors`: counts and types in
  plain words ("3 double-hung, builder grade").
- `observations`: the bullet findings, one sentence or two each, max 400
  characters, max 12. Condition notes, quirks, watch items.
- `conditionRating`: Excellent, Good, Fair, Poor, or Critical. Only when
  Adam gave one. Omit otherwise.
- `specs`: only for extra label/value rows not covered by dims/ceiling/
  level; the app derives the standard strip from the fields above.

## The "Not yet documented" convention

Omit any field you do not know. Do not write "unknown", "TBD", "N/A", or a
guess. An omitted field renders as a quiet "Not yet documented" and becomes
a to-do for the next visit; a guessed field becomes a lie in a client's
permanent record.

## Rules

- No invented facts, no invented prices, no em-dashes (the server rejects
  them anyway).
- Re-authoring an existing page overwrites its content: call `get_page`
  first and carry forward anything still true.
- After the write, read the result back to Adam in one line ("Primary
  Suite updated: condition Good, 4 observations") and move to the next
  page only when he is ready.
