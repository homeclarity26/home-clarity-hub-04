# PHASE 4 — Chapter content

Goal: build out Information and Strategy chapters to canonical structure.

---

## PR #9 — Information chapter pages

**Branch:** `phase-4/pr-09-information`
**Files:** `src/data/reportContent.ts`, wizard TOC seeding

**Tasks:**

1. Add 5 new pages to `reportPages`:

```ts
"welcome-letter": {
  id: "welcome-letter",
  title: "Welcome from Adam",
  group: "information",
  narrative: [/* TextBlock with placeholder welcome letter */],
},
"home-at-a-glance": {
  id: "home-at-a-glance",
  title: "Your Home At-a-Glance",
  group: "information",
  narrative: [/* placeholder specs/permits/sales summary */],
},
"vision-inventory": {
  id: "vision-inventory",
  title: "Project Vision Inventory",
  group: "information",
  narrative: [/* placeholder vision list */],
},
"top-priorities": {
  id: "top-priorities",
  title: "Top Priorities",
  group: "information",
  narrative: [/* placeholder priority list */],
},
"how-to-use": {
  id: "how-to-use",
  title: "How to Use This Report",
  group: "information",
  narrative: [/* placeholder navigation guide */],
},
```

Plus existing `executive-summary`. Total: 6 Information pages.

2. Update the `information` group's pages array (in this order):

```ts
pages: ["welcome-letter", "executive-summary", "home-at-a-glance", "vision-inventory", "top-priorities", "how-to-use"]
```

3. Update wizard TOC seeding so new reports auto-include all 6 Information pages with `included: true` by default.

4. Each page uses Template E (Generic). No new template wrappers needed.

5. Seed each narrative with reasonable placeholder text in HBC's voice (warm, authoritative, no jargon, no em-dashes per CLAUDE.md rules).

**Verify:** `bun run build` clean, `npx tsc --noEmit` 0 errors. Visit Information chapter, see all 6 pages in order.

**Merge:** auto.

---

## PR #10 — Strategy chapter standing pages

**Branch:** `phase-4/pr-10-strategy`
**Files:** `src/data/reportContent.ts`, `src/components/tabs/ReportTab.tsx`

**Tasks:**

1. Add 5 standing pages to Strategy:

```ts
"recurring-services": {
  id: "recurring-services",
  title: "Recurring Services Register",
  group: "strategy",
  // renders RecurringServicesRegisterBlock
},
"capital-plan-10yr": {
  id: "capital-plan-10yr",
  title: "10-Year Capital Plan",
  group: "strategy",
  // renders CapitalPlanBlock
},
"maintenance-calendar": {
  id: "maintenance-calendar",
  title: "Maintenance Calendar",
  group: "strategy",
  // renders MaintenanceCalendarBlock
},
"sequencing-dependencies": {
  id: "sequencing-dependencies",
  title: "Sequencing & Dependencies",
  group: "strategy",
  // renders StrategicPlanBlock
},
"membership": {
  id: "membership",
  title: "How We Work With You Going Forward",
  group: "strategy",
  // generic template, text-driven
},
```

2. Update `strategy` group's pages array (vision projects prepend dynamically at runtime):

```ts
pages: ["recurring-services", "capital-plan-10yr", "maintenance-calendar", "sequencing-dependencies", "membership"]
```

3. Delete or migrate `financial-roadmap` and `action-plan` page references. No production reports yet, so simple deletion is fine.

4. In `ReportTab.tsx`, route Strategy standing pages to dedicated block components when `page.page_key` matches:

```tsx
if (template === "vision") return <VisionTemplatePage ... />;
if (page.page_key === "recurring-services") return <RecurringServicesPage ... />;
if (page.page_key === "capital-plan-10yr") return <CapitalPlanPage ... />;
// etc.
```

Each Strategy standing page is a small wrapper rendering its assigned block as page body. Place wrappers in `src/components/report/templates/strategy/`.

**Verify:** `bun run build` clean, `npx tsc --noEmit` 0 errors. Strategy chapter shows: vision projects (if any) + 5 standing pages.

**Merge:** auto.

---

**End of Phase 4.** Append `- [x] PHASE 4 COMPLETE` to `TODO.md`.

Next: read `docs/rebuild/PHASE_5.md`.
