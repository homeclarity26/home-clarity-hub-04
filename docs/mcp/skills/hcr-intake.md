# HCR Intake

Turn a walkthrough debrief (voice transcript, typed notes, or a rambling
conversation with Adam) into an organized findings summary and a proposed
page list for a Home Clarity Report. This skill is the first step of every
authoring session; the author-* skills write the pages afterward.

## When to use

Adam says something like "here are my notes from the Hendersons",
"transcribing my walkthrough", or pastes raw observations. Also use it when
he starts describing a home conversationally and you realize a report is
forming.

## Workflow

1. Call `list_properties` and match the client. Confirm the report_id with
   Adam if more than one report exists for the property.
2. Call `get_report` to see what pages already exist and what is missing.
3. Read the notes once for the whole-house story, then a second time
   extracting per-area facts. Sort every fact into one of:
   - a room (interior or exterior space)
   - a system or appliance
   - a vision project (anything Adam frames as "someday", "they want",
     "imagine if")
   - strategy material (recurring services, replacement timing, seasonal
     tasks)
   - client context that belongs nowhere in the report (keep it out)
4. Present a findings summary grouped that way, each fact one short line,
   with the exact quote or paraphrase source when ambiguous.
5. Propose a TOC delta: which existing pages to update and which page_keys
   to create (lowercase kebab-case: `primary-suite`, `hvac-furnace`,
   `kitchen-vision-project`). Group names: Information, Interior Spaces,
   Exterior Spaces, Systems and Appliances, Strategy.
6. Stop and get Adam's yes before writing anything. Then hand off to the
   author skills one page at a time.

## Rules

- Never invent a fact. If the notes do not say the furnace's install year,
  the finding is "install year not captured". Missing data renders as
  "Not yet documented" in the app, which is honest and fine.
- Never invent prices. Dollar figures come from Adam's mouth or not at all.
- Condition ratings are word-based only: Excellent, Good, Fair, Poor,
  Critical. Only assign one when Adam stated or clearly implied it.
- No em-dashes in anything destined for the report. The server rejects
  them, so catch it here first.
- Keep each finding under 400 characters. If a note wants to be a
  paragraph, it is probably two findings.
- Photos are handled in the app, not through these tools. If notes mention
  photos, list them as "photo needed: ..." reminders for Adam.
