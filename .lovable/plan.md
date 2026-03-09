

## Next Step: Enhanced Edit Mode UX

Database persistence is complete. The next highest-impact work is improving the creator editing experience.

### What to build

**1. Creator Bar (40px sticky bar at top of report pages in Edit Mode)**
- Page status badge: Draft / Complete / Needs Review (clickable dropdown to change)
- Previous / Next page navigation arrows
- Auto-save indicator (moved from current position into the bar)
- Only visible when `canEdit` is true

**2. More Editable Blocks**
Currently only narrative and recommendations are editable. Expand to:
- **Title** — click to edit inline with a text input
- **Condition Rating** — click to open a dropdown (Excellent / Good / Fair / Poor / Critical)
- **System Specifications** — editable label/value pairs with add/remove rows
- **Pricing Tiers** — editable price and description for each tier (Essential / Enhanced / Signature)
- **Timing** — click to edit inline or dropdown

**3. Editable Hover States**
- Dashed gold (`border-accent`) border on hover over any editable block in Edit Mode
- Subtle warm background tint (`bg-accent/5`)
- Text cursor on hover

### Files to create/modify
- `src/components/report/CreatorBar.tsx` — new component
- `src/components/report/ReportPage.tsx` — wrap all sections in editable containers, add CreatorBar
- `src/components/report/EditableField.tsx` — generic inline text edit component
- `src/components/report/EditableDropdown.tsx` — for condition rating / timing
- `src/components/report/EditableSpecs.tsx` — editable spec table
- `src/components/report/EditableTiers.tsx` — editable pricing tiers
- `src/components/editor/EditableSection.tsx` — update hover styles to dashed gold

### No database changes needed
All fields already exist on `report_pages` table. The `useReportPage` hook already supports updating any field.

