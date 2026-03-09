
# Redesign Home Tab Landing Page

## What changes
Single file edit: `src/components/tabs/HomeTab.tsx` — full rewrite.
Also add `propertyAddress` prop pass-through in `src/pages/Index.tsx`.

## Props to add to HomeTab
- `propertyAddress?: string` — shown below hero subtitle
- `onTabChange?: (tab: string) => void` — needed for cross-tab navigation (Payments, Schedule, Contacts, Contacts for advisor)

Pass from `Index.tsx`: `propertyAddress={portal.property?.address || ""}` and `onTabChange={handleTabChange}`.

## Hero Section (tighten, keep structure)
- Keep white/clean background (no image, no navy)
- `py-12 md:py-16` instead of current `py-16 md:py-24` — reduces empty space
- Property name in Playfair Display, large
- "HOME OPERATING SYSTEM" in gold mono label below name
- Property address in Inter 16px muted below that (conditionally rendered if present)

## Card Row 1: Portal Status (2 cards side by side)

**Card: "Home Clarity Report"**
- Icon: `FileText` in gold
- Title: Playfair 20–22px
- Subtitle: "Your complete home assessment"
- Progress indicator: thin gold bar + `{completionPercent}% Complete` badge (reuse the same bar pattern as current code)
- Status badge: "IN PROGRESS" or "COMPLETE" in mono text
- Thin gold left border (`border-l-[3px] border-accent`)
- `onClick={() => onNavigate("report")}`

**Card: "Active Projects"**
- Icon: `Hammer` in muted
- Title: Playfair 20–22px
- Subtitle: "Track ongoing home improvements"
- Badge: "No active projects" in muted mono
- `onClick={() => onNavigate("projects")}`

## Card Row 2: Portal Navigation (3 cards, `grid-cols-1 sm:grid-cols-3`)

| Card | Icon | Subtitle | Target |
|---|---|---|---|
| Payments & Financial | `Receipt` | "Manage your account and transaction history" | `onNavigate("payments")` |
| Schedule & Timeline | `Calendar` | "Upcoming appointments and maintenance reminders" | `onNavigate("schedule")` |
| Your Home Team | `Users` | "HBC advisors and approved vendor partners" | `onNavigate("contacts")` |

## Card Row 3: Quick Actions (3 cards — exact same pattern as ReportTab Row 3)

| Card | Icon | Subtitle | Action |
|---|---|---|---|
| View Your Report | `FileText` | "Read your complete Home Clarity assessment" | `onNavigate("report")` |
| Ask a Question | `MessageCircle` | "AI-powered answers about your home" | focus footer search input (same trick as ReportTab) |
| Contact Your Advisor | `Phone` | "Adam Kinney — Founder & Lead Advisor" | `onTabChange?.("contacts")` |

## Card Visual Language (matches ReportTab exactly)
- `bg-card rounded-lg p-6 md:p-8 shadow-hbc-sm hover:shadow-hbc-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border`
- Title: `font-display text-xl text-foreground`
- Subtitle: `font-sans text-sm text-muted-foreground`
- Icon: `w-5 h-5 text-accent` (gold) or `text-muted-foreground`
- Chevron: `ChevronRight w-4 h-4 text-muted-foreground/30 group-hover:text-accent mt-auto`
- Report card gets `border-l-[3px] border-accent` to emphasize it as primary

## Section headers between rows
Same as ReportTab: `font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6`

Labels: "YOUR PORTAL STATUS", "NAVIGATE YOUR PORTAL", "QUICK ACTIONS"

## Mobile
All rows stack to single column naturally via `grid-cols-1` → responsive breakpoints.

## Files to modify
1. `src/components/tabs/HomeTab.tsx` — complete rewrite
2. `src/pages/Index.tsx` — add `propertyAddress` and `onTabChange` props to `<HomeTab>`
