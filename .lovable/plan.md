

# Redesign Report Landing Page — Bento Card Grid

## Overview
Replace the plain text TOC on the Report cover page with a visually striking bento-style card grid. Keep the improved hero, add digital asset cards, report navigation cards, and quick access cards.

## Changes (single file: `src/components/tabs/ReportTab.tsx`)

### Hero Section (keep + enhance)
- Keep navy hero with Playfair "Home Clarity Report"
- Add property address below title: Inter 16px, white/70 opacity
- Keep "YOUR HOME" gold label above, mono subtitle below
- Keep PDF download button top-right

### Card Row 1: Digital Home Assets
Four cards in a horizontal row (stacks on mobile). Dark navy background with white/gold text to distinguish from other cards. Each card:
- Icon (from lucide-react: `Box`, `Ruler`, `LayoutDashboard`, `View`)
- Title in Playfair 20px
- Subtitle in Inter 14px
- Thin gold left border
- Opens external links in new tab
- For now, links will be placeholder `#` URLs (these will be populated per-property later from the database)

### Card Row 2: Report Navigation (3x2 grid → stacks on mobile)
White cards with subtle shadow. Each represents a report group:
- **Full Report** — slightly larger/emphasized, navigates to a full TOC view (we'll add a `showFullTOC` state that renders the existing TOC list)
- **Exterior Assessment** — navigates to first exterior page, shows section count
- **Interior Assessment** — navigates to first interior page, shows section count  
- **Systems & Equipment** — navigates to first systems page, shows section count
- **Strategic Plan** — gold accent, navigates to first strategy page

Each card shows condition rating badges (color-coded) only if relevant. Hover: `translateY(-2px)` + shadow deepen. Small chevron-right icon.

### Card Row 3: Quick Access (3 cards)
- **Your HBC Membership** — links to membership page or external
- **Ask a Question** — triggers chat panel open (need to lift `setChatOpen` or use the footer search focus)
- **Contact Your Advisor** — navigates to contacts tab using `onNavigate`

### Props additions
- Add `onTabChange?: (tab: string) => void` prop to ReportTab so "Contact Your Advisor" and "Ask a Question" can navigate outside the report
- Pass it from `Index.tsx`

### Mobile
- Row 1: horizontal scroll or 2x2 grid
- Row 2 & 3: single column stack
- Generous padding preserved

### Full TOC view
When "Full Report" card is clicked, set a local state `showFullTOC = true` that renders the existing grouped page list (the current TOC code, preserved). A back button returns to the card grid.

## Files to modify
1. **`src/components/tabs/ReportTab.tsx`** — Complete rewrite of the cover page section (lines 89-186). Keep the individual page view (lines 42-86) unchanged.
2. **`src/pages/Index.tsx`** — Pass `onTabChange={handleTabChange}` to ReportTab.

## No database changes needed
All card content is hardcoded in the component for now. Digital asset URLs will be wired to property data later.

