

# Redesign Projects, Payments, Contacts, Schedule Tabs + Minor Fixes

## Scope: 7 files modified

### Minor Fixes (3 files)

**1. `src/components/tabs/HomeTab.tsx`** — Normalize Row 2 card subtitles
- Shorten subtitle text to single lines matching ReportTab card density
- Set consistent `min-h-[180px]` on Row 2 cards so heights align

**2. `src/components/tabs/ReportTab.tsx`** — Fix "Full Report" card size
- Remove `md:col-span-2 lg:col-span-1` from the Full Report card (line 299)
- All 5 section cards render identically in the 3-col grid — Full Report is just another card

**3. `src/components/Header.tsx`** — Fix "SCHEDULEEDIT" concatenation
- The Edit toggle (lines 67-73) sits adjacent to the nav. On some widths the "Edit" label may visually merge with "Schedule". Fix: move the Edit switch to the far right next to the avatar, or add a visible separator. The cleanest fix: remove the "Edit" text label from next to the switch and replace with a small `Pencil` icon toggle, visually separated from nav items by a `border-l border-border pl-4` divider.

---

### Full Tab Rewrites (4 files)

All four tabs follow the same pattern: compact hero → section-labeled card rows → quick actions row. Every card uses the same classes:
```
group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 
transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full
```
Gold icons (`text-accent`), Playfair titles (`font-display text-xl`), Inter subtitles (`font-sans text-sm text-muted-foreground`), gold chevrons on hover.

---

**4. `src/components/tabs/ProjectsTab.tsx`** — Full rewrite

- **Props**: Keep `onNavigate`, `propertyId`, `pages`. Add `onTabChange` (pass from Index.tsx).
- **Hero**: Compact `py-12 md:py-16`, same as HomeTab
- **Row 1 "PROJECT STATUS"**: 2 cards
  - "Active Projects" — `Hammer` icon, gold left border, badge shows count or "NO ACTIVE PROJECTS"
  - "Project Archive" — `Archive` icon, badge shows count or "NO COMPLETED PROJECTS YET"
- **Row 2 "UPCOMING CONSIDERATIONS"**: 3-col grid of cards built from `pages` prop (filter pages with `timing`). Each card: `Wrench` icon, title in Playfair, timing as subtitle, colored urgency badge top-right:
  - "Immediate" / "Year 1" → red `bg-destructive/10 text-destructive` "URGENT"
  - "Year 1–2" / "Year 2–3" → amber `bg-accent/20 text-accent-foreground` "SOON"
  - "Year 3+" → grey `bg-muted text-muted-foreground` "FUTURE"
- **Row 3 "QUICK ACTIONS"**: 2 cards — "Review Report Recommendations" → report tab, "Contact Your Advisor" → contacts tab
- Remove all Supabase fetching (keep it simple, derive from props). Remove empty grey space.

**5. `src/components/tabs/PaymentsTab.tsx`** — Full rewrite

- **Hero**: Compact
- **Row 1 "FINANCIAL STATUS"**: 3 cards
  - "Current Balance" — `Receipt` icon, gold left border, shows balance from DB or falls back to `$4,500` (matching footer). If no DB data, show the static footer value.
  - "Total Paid" — `ShieldCheck` icon, computed from paid invoices
  - "Next Payment" — `Calendar` icon, shows next due date or "None scheduled"
- **Row 2 "TRANSACTION HISTORY"**: Full-width card with table (keep existing table logic) or premium empty state: `List` icon, "No Transactions Yet", muted subtitle
- **Row 3 "QUICK ACTIONS"**: 2 cards — "Contact About Billing" → contacts, "View Your Report" → report
- Keep Supabase invoice fetching but wrap in the new card system

**6. `src/components/tabs/ContactsTab.tsx`** — Full rewrite

- **Hero**: Compact
- **Row 1 "YOUR HBC TEAM"**: 2 cards
  - "Adam Kinney" (from `creator` prop) — `User` icon, gold left border, "Founder & Lead Advisor" subtitle, email/phone in small muted text
  - "HBC Support Team" — `Headset` icon, "Client Services" subtitle, support@hbc.com
- **Row 2 "APPROVED VENDOR PARTNERS"**: 2×2 grid of 4 placeholder cards
  - "General Contractor" (`Hammer`), "HVAC Specialist" (`Thermometer`), "Electrician" (`Zap`), "Landscaper" (`TreePine`)
  - Each: muted/greyed treatment (`opacity-60`), badge "TO BE ASSIGNED"
- **Row 3 "QUICK ACTIONS"**: 2 cards — "Schedule a Call" (`Phone`), "Ask a Question" (`MessageCircle`, triggers footer chat)
- Remove all long paragraphs and flat list styling

**7. `src/components/tabs/ScheduleTab.tsx`** — Full rewrite

- **Hero**: Compact, keep subtitle about appointments
- **Row 1 "THIS WEEK"**: 2 cards
  - "This Week" — `Calendar` icon, empty state or event list from DB
  - "Upcoming Appointments" — `Clock` icon, count badge if events exist
- **Row 2 "ANNUAL MAINTENANCE REMINDERS"**: 2×2 grid
  - "Spring Checklist" (`Sun`), "Summer Checklist" (`Thermometer`), "Fall Checklist" (`Leaf`), "Winter Checklist" (`Snowflake`)
  - Each: subtitle listing tasks, badge "REPORT IN PROGRESS"
- **Row 3 "QUICK ACTIONS"**: 2 cards — "Contact Your Advisor" → contacts, "View Your Projects" → projects
- Keep Supabase event fetching for Row 1, wrap in card system

---

### Index.tsx Changes

Pass `onTabChange={handleTabChange}` to `ProjectsTab`, `PaymentsTab`, `ContactsTab`, `ScheduleTab` so Quick Action cards can navigate across tabs.

---

### Files Modified (7 total)
1. `src/components/Header.tsx` — Fix Edit toggle visual separation
2. `src/components/tabs/HomeTab.tsx` — Normalize card subtitle length + min-height
3. `src/components/tabs/ReportTab.tsx` — Fix Full Report card span
4. `src/components/tabs/ProjectsTab.tsx` — Full rewrite to bento cards
5. `src/components/tabs/PaymentsTab.tsx` — Full rewrite to bento cards
6. `src/components/tabs/ContactsTab.tsx` — Full rewrite to bento cards
7. `src/components/tabs/ScheduleTab.tsx` — Full rewrite to bento cards
8. `src/pages/Index.tsx` — Pass `onTabChange` to all tabs

