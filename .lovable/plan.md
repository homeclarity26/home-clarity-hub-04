

# Fix Visual Consistency Between Home Tab and Report Tab

## Changes (2 files)

### 1. `src/components/tabs/HomeTab.tsx`
- Add `line-clamp-2` to all subtitle `<p>` tags in the "Navigate Your Portal" row (lines 105, 117, 129) to prevent uneven card heights.
- Also add `line-clamp-2` to Quick Actions subtitle text for consistency.

### 2. `src/components/tabs/ReportTab.tsx`
**Report Section Cards (lines 282-334):**
- The grid is `md:grid-cols-2 lg:grid-cols-3` with 5 cards — "Full Report" sits alone at top or takes a full column. Change it so all 5 cards use the same base styling.
- Give the "Full Report" card an intentional primary-card treatment: add `border-l-[3px] border-l-accent` (matching the Home tab's "Home Clarity Report" card pattern) to distinguish it purposefully rather than by accidental size difference.
- Standardize all Report Section cards to match Home tab cards:
  - Padding: `p-8` (already matches)
  - Icon size: `w-5 h-5` (already matches)
  - Title: `font-display text-xl` (change from `text-xl` — already matches)
  - Subtitle: `font-sans text-sm text-muted-foreground` + add `line-clamp-2`
  - Add `min-h-[180px]` to all section cards so they stay uniform height (matching Home tab's Navigate row)
- Quick Access row (lines 342-381): Normalize from `p-6` / `text-lg` to `p-8` / `text-xl` to match Home tab card sizing, and add `line-clamp-2` to subtitles.

### Specific Token Alignment
| Token | Home Tab | Report Tab (current) | Report Tab (fixed) |
|-------|----------|---------------------|-------------------|
| Card padding | `p-8` | `p-8` (sections), `p-6` (quick access) | `p-8` everywhere |
| Icon | `w-5 h-5` | `w-5 h-5` | `w-5 h-5` |
| Title | `font-display text-xl` | `text-xl` (sections), `text-lg` (quick access) | `text-xl` everywhere |
| Subtitle | `font-sans text-sm` | `text-sm` | `text-sm` + `line-clamp-2` |
| Min height | `min-h-[180px]` (nav row) | none | `min-h-[180px]` on section cards |

