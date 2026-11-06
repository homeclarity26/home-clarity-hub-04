# HCR Author: Systems and Appliances

Write one system or appliance page through `upsert_system_page`. Systems
(furnace, water heater, panel, roof) get the full lifecycle treatment and
can carry a replacement briefing; appliances (`is_appliance: true`) get the
simpler record with no briefing.

## Voice

Calm and factual, like a good mechanic explaining your car: age, condition,
what to expect, when to plan. Never fear-based. "It is deep into borrowed
time" is fine; "IMMINENT FAILURE RISK" is not. No em-dashes. Word-based
condition ratings only.

## Field-by-field mapping

Envelope: `report_id`, `page_key` ("hvac-furnace"), `title` ("Furnace"),
`group` ("Systems and Appliances"), `is_appliance`.

`content`:

- `make`, `model`, `serial`, `installDate` (ISO date or bare year "2009"):
  from the data plate or records. This identity block is the heart of the
  page; never guess a serial.
- `lifespanYears` and `currentAgeYears`: systems only. If you give
  `installDate` and omit `currentAgeYears`, the server derives the age.
  These drive the lifecycle bar the client sees.
- `conditionRating`: Excellent / Good / Fair / Poor / Critical, only when
  Adam assessed it.
- `statusFlags`: at most a few short flags; the first one renders as the
  status chip ("Approaching End-of-Life", "Operational").
- `specs`: extra label/value rows beyond identity (Capacity, Efficiency,
  Fuel, Filter size). The server builds the identity grid itself; do not
  repeat make/model here.
- `narrative` + `observations`: same rules as spaces. Narrative is 1 to 2
  short paragraphs of context; observations are bullet findings, max 400
  characters each.
- `needsBriefing: true`: attach the replacement-briefing block before
  details exist (Adam said "this one needs a briefing").
- `replacementBriefing`: the pre-scoped replacement details as they get
  captured over visits: `capacity`, `voltage`, `gasLine`, `condensate`,
  `ductworkNotes`, `accessNotes`, and `tiers`.

## Tier pricing: the hard rule

`tiers` is the Essential / Enhanced / Signature triple. Provide it only
when Adam has priced all three tiers with real low/high ranges and a real
scope description each. A partially priced set is rejected and an unpriced
set must be omitted; the block then shows the tier scaffolding without
numbers, which is the honest state. Never estimate a price to fill a gap.

## Rules

- Omit unknown fields; they render as "Not yet documented".
- `get_page` before re-authoring an existing page; carry forward what is
  still true (a briefing built over three visits must not lose fields).
- Photos (unit, serial plate, install location) flow through the app, not
  these tools; remind Adam when slots are empty.
