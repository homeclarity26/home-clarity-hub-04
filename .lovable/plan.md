

## Home Page Audit & Reorganization Recommendations

### Current Sections (top to bottom, 20+ distinct sections)

| # | Section | What it does |
|---|---------|-------------|
| 1 | **Welcome Header** | Greeting, address, home value |
| 2 | **AI Command Bar** | Concierge input + prompt chips |
| 3 | **Smart Action Tiles** | 6 dynamic navigation cards |
| 4 | **AI Suggestions Strip** | Proactive nudges (maintenance, proposals) |
| 5 | **Compact Health Bar** | Overall + category health scores |
| 6 | **Membership Banner** | Membership status (conditional) |
| 7 | **Getting Started Checklist** | Onboarding steps (conditional, <100% complete) |
| 8 | **AI Priority Card** | "Top 3 Priorities Right Now" |
| 9 | **Predictive Maintenance Card** | AI-predicted upcoming failures |
| 10 | **Satisfaction Survey** | In-page satisfaction prompt |
| 11 | **Cost Comparison Tool** | Compare repair vs replace costs |
| 12 | **Home Value Tracker** | Value history chart + Zestimate |
| 13 | **Annual Report Card** | Yearly summary |
| 14 | **Seasonal Maintenance Tips** | Season-specific checklist |
| 15 | **Document Expiration Tracker** | Expiring warranties/policies |
| 16 | **Maintenance Reminders** | Overdue/upcoming maintenance |
| 17 | **Home Goals** | Goal-setting tracker |
| 18 | **Home Improvement Wishlist** | Wish list of future projects |
| 19 | **Insurance Assistant** | Coverage analysis tool |
| 20 | **Client Referral Portal** | Full referral page with link, history |
| 21 | **Portal Status Cards** | Report + Projects progress (2 cards) |
| 22 | **Navigate Your Portal** | Payments, Schedule, Contacts links (3 cards) |
| 23 | **Quick Actions** | View Report, Ask Question, Contact Advisor (3 cards) |
| 24 | **Service Request Form** | Report an issue |
| 25 | **Advisor Signature** | Custom sign-off text |
| 26 | **Property Timeline** | Full chronological history |
| 27 | **Schedule Consultation** | Book appointment CTA |
| 28 | **My Home's Story** | Narrative property history |
| 29 | **Feedback Widget** | "How's your experience?" |

---

### Redundant / Duplicated Content

- **Smart Action Tiles (#3) ↔ Portal Status Cards (#21) ↔ Navigate Your Portal (#22) ↔ Quick Actions (#23)**: Four separate sections that all serve as navigation shortcuts. The Smart Action Tiles already dynamically surface the most relevant links. The other three are static duplicates.
- **AI Priority Card (#8) ↔ AI Suggestions Strip (#4)**: Both surface AI-generated action items. The Priority Card is a more detailed version of what the Suggestions Strip already covers.
- **Predictive Maintenance (#9) ↔ Maintenance Reminders (#16) ↔ Seasonal Maintenance Tips (#14)**: Three separate maintenance-related sections. Overlapping concern.
- **Property Timeline (#26) ↔ My Home's Story (#28)**: Both tell the chronological story of the property.
- **Satisfaction Survey (#10) ↔ Feedback Widget (#29)**: Two separate feedback collection mechanisms.

---

### Recommended Relocations

| Section | Move to | Rationale |
|---------|---------|-----------|
| **Cost Comparison Tool** | **Report tab** | It's a deeper analytical tool tied to report findings |
| **Home Value Tracker** | **Home tab** (keep, but slim down) or new **Finances** section in Billing tab | Financial data belongs with billing/payments |
| **Annual Report Card** | **Report tab** | Directly related to the report |
| **Document Expiration Tracker** | **Documents tab** | Already has a Documents tab |
| **Maintenance Reminders** | **Schedule tab** | Maintenance tasks are schedule items |
| **Seasonal Maintenance Tips** | **Schedule tab** | Seasonal tasks = schedule content |
| **Predictive Maintenance** | **Schedule tab** or **Equipment tab** | Predictions about equipment belong with equipment/schedule |
| **Home Goals** | **Projects tab** | Goals are aspirational projects |
| **Home Improvement Wishlist** | **Projects tab** | Wishlists are future projects |
| **Insurance Assistant** | **Documents tab** | Insurance docs/coverage = documents |
| **Client Referral Portal** | **Refer tab** (already exists) | Already has its own tab — remove from home entirely |
| **Property Timeline** | **Report tab** (as a sub-section) | Deep historical view, not dashboard content |
| **My Home's Story** | **Report tab** | Narrative history = report content |
| **Service Request Form** | **Services tab** or accessible via AI Command Bar | Not a dashboard widget |

---

### What Should Stay on the Home Page (7 items)

1. **Welcome Header** — The greeting and context-setting
2. **AI Command Bar** — The primary interaction point
3. **Smart Action Tiles** — Dynamic, personalized navigation (replaces all static nav sections)
4. **AI Suggestions Strip** — Merged with AI Priority Card into one concise strip (max 3-4 items)
5. **Compact Health Bar** — At-a-glance health overview
6. **Getting Started Checklist** — Only when onboarding is incomplete (conditional)
7. **Membership Banner** — Only when relevant (conditional)

Plus a single **Schedule Consultation** CTA button at the bottom, and the **Advisor Signature** if configured.

---

### Sections to Remove Entirely from Home

- **Portal Status Cards** — redundant with Smart Action Tiles
- **Navigate Your Portal** — redundant with Smart Action Tiles
- **Quick Actions** — redundant with Smart Action Tiles
- **Satisfaction Survey** — keep only the Feedback Widget (or move both to a settings/profile area)
- **Feedback Widget** — consolidate with NPS Survey Card (already exists in Index.tsx)

---

### New Tab Recommendation

No new tabs needed. All displaced content maps to existing tabs:
- **Report tab**: Cost Comparison, Annual Report, Property Timeline, My Home's Story
- **Schedule tab**: Maintenance Reminders, Seasonal Tips, Predictive Maintenance
- **Equipment tab**: Predictive Maintenance (alternative home)
- **Projects tab**: Home Goals, Home Improvement Wishlist
- **Documents tab**: Document Expiration Tracker, Insurance Assistant
- **Refer tab**: Client Referral Portal (already exists)
- **Billing tab**: Home Value Tracker (optional)

---

### Result

The home page goes from **29 sections requiring extensive scrolling** down to **~7 focused sections** that fit comfortably in 1-2 viewport heights. Every removed section finds a logical home in an existing tab. The page becomes a true command center: greet, ask, act, check health — done.

### Implementation Approach

1. Move displaced components into their destination tabs (add them to the respective tab files)
2. Strip HomeTab.tsx down to the 7 retained sections
3. Merge AI Priority Card content into the AI Suggestions Strip component
4. No database or routing changes required — purely a layout reorganization

