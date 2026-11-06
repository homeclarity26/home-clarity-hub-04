// Information chapter of the Caldwell demo report: the first six pages a
// reader opens. Designed pages, kept short on purpose. Facts follow
// docs/demo/CALDWELL_DEMO_BIBLE.md.

import type { DemoInfoPage } from "./caldwellTypes";

export const caldwellInfoPages: DemoInfoPage[] = [
  {
    key: "welcome-letter",
    title: "Welcome Letter from Adam",
    lede: "Mark, Jennifer, Olivia and Jack: thank you for giving me more than two hours in your home.",
    sections: [
      {
        paragraphs: [
          "You walked me through every room at 2847 Stoneybrook Lane, from the barrel-vault foyer to the mechanical room, and you were honest about what you love and what quietly bugs you. That honesty is what makes this report useful. Jennifer, your thoughts on the primary bath and the kitchen backsplash are in here. Mark, so are your questions about the furnaces and the screened porch.",
          "The short version: you have a very good house. It is a 1998 Colonial that has been cared for, with a kitchen remodel that was done right. A handful of things need a plan, and the two 17-year-old furnaces lead that list. None of it is an emergency today, and all of it goes better when you choose the timing.",
          "This report is yours, and it keeps growing with the house. Every room, system and appliance has its own page, and the Strategy chapter lays out a sensible order for the next ten years. Read it at your own pace, ask Bobby anything, and call me when you want to talk through what comes first.",
        ],
      },
    ],
    signature: "Adam Kilgore, founder, Hometown Builders Club",
  },
  {
    key: "executive-summary",
    title: "Executive Summary",
    lede: "Five things to know about your home, in the order we would talk about them at your kitchen island.",
    numbered: [
      {
        title: "Your home is in excellent overall condition",
        body: "Most rooms and systems rate Excellent or Good, and nothing rates Critical. The bones are solid: 2x6 framing, a poured concrete foundation and a 200-amp panel with no concerns.",
      },
      {
        title: "HVAC is the highest-priority infrastructure concern",
        body: "Both Lennox furnaces were installed in 2009 and are 17 years into a typical 20-year life. They run today; the goal is to replace them on your schedule, not on a January service call.",
      },
      {
        title: "The 2017 kitchen needs refinement, not redoing",
        body: "The renovation was done well. The cabinetry, the layout and the Sub-Zero, Wolf and Cove appliances all stay; new counters, a full-height backsplash and a refinished island finish the job.",
      },
      {
        title: "The primary bath and the screened porch are your two highest-impact upgrades",
        body: "Jennifer wants the dated corner tub gone and a true spa shower in its place. Mark wants a porch that works in February. Both are scoped and priced in the Strategy chapter.",
      },
      {
        title: "Recurring services are scattered, and nine are overdue",
        body: "Twenty services are spread across twelve vendors and your own to-do list, and nine have slipped past due. Bringing them under one coordinator is the clearest opportunity in this report.",
      },
    ],
  },
  {
    key: "home-at-a-glance",
    title: "Your Home At-a-Glance",
    lede: "The essential facts of 2847 Stoneybrook Lane, Hudson, on one page.",
    stats: [
      { label: "Built", value: "1998", subtitle: "Two-story Colonial" },
      { label: "Living area", value: "5,240 sqft" },
      { label: "Bedrooms and baths", value: "5 bed / 4.5 bath" },
      { label: "Lot", value: "1.4 acres", subtitle: "Wooded" },
      { label: "Spaces documented", value: "33", subtitle: "Rooms and outdoor spaces" },
      { label: "Systems and appliances", value: "28", subtitle: "11 systems, 17 appliances" },
      { label: "Estimated value", value: "$1.4M" },
      { label: "Last sale", value: "2014" },
    ],
    sections: [
      {
        heading: "Construction",
        bullets: [
          "Conventional 2x6 framing, original to the 1998 build",
          "Poured concrete foundation with a finished lower level",
          "200-amp Square D QO electrical panel",
        ],
      },
      {
        heading: "Permits on file",
        paragraphs: ["Three permits are on record with the city since the home was built."],
        bullets: [
          "2009: HVAC replacement, both furnaces",
          "2017: Kitchen remodel",
          "2020: Outdoor kitchen gas line",
        ],
      },
      {
        heading: "Scan data",
        bullets: [
          "Hover exterior scan: 5,157 sqft of roof, 4,831 sqft of siding, 68 windows",
          "iGUIDE interior scan: 33 panoramic stops you can walk through room by room",
        ],
      },
    ],
  },
  {
    key: "vision-inventory",
    title: "Project Vision Inventory",
    lede: "Everything you told us you want for this house, big and small, so none of it gets lost. The six larger projects each have a full page in the Strategy chapter.",
    sections: [
      {
        heading: "Inside the house",
        bullets: [
          "Primary Bath: Spa Conversion. Jennifer's first request: remove the corner tub and build a real wet-room shower with heated floors.",
          "Kitchen Refresh: Counters & Backsplash. New stone, a full-height backsplash and a contrasting island; the cabinetry stays.",
        ],
      },
      {
        heading: "Comfort and mechanicals",
        bullets: [
          "HVAC Replacement: Both Zones. Mark wants the two 2009 furnaces replaced on a plan, with steadier temperatures upstairs.",
        ],
      },
      {
        heading: "Outside",
        bullets: [
          "Screened Porch: Four-Season Conversion. Insulation, retractable glass and a mini-split so the porch works all year.",
          "Driveway Replacement & Front Walkway. Replace the original asphalt and rebuild the front walk to match.",
          "Roof Replacement with Ventilation Upgrade. New shingles, a ridge vent and new gutters when the original roof reaches the end of its life.",
        ],
      },
      {
        heading: "Smaller wishes",
        bullets: [
          "Better lighting in the primary walk-in closet",
          "A rebuilt mudroom bench with storage that fits two kids' worth of gear",
          "An EV charger in the three-car garage",
          "A reliable water dispenser on the Sub-Zero; a service visit is already pending",
        ],
      },
    ],
  },
  {
    key: "top-priorities",
    title: "Top Priorities",
    lede: "If you do only four things with this report, do these, in this order.",
    numbered: [
      {
        title: "Catch up the nine overdue services",
        tag: "This season",
        body: "The furnace tune-ups, filters, chimney sweep, gutters, sump pump test and dryer vent are the ones to close out before winter. Most are a single visit, and Bobby can schedule them for you.",
      },
      {
        title: "Plan the furnace replacements before a failure forces it",
        tag: "Year 1",
        body: "Both furnaces are 17 years old. Choose your tier and your season now, and the replacement becomes a planned two-day job with the briefing already written.",
      },
      {
        title: "Start design for the primary bath",
        tag: "Year 1-2",
        body: "Design takes 4 to 6 weeks and settles every decision before anything is torn out. Starting it this winter keeps construction on your calendar, not ours.",
      },
      {
        title: "Set up HBC Concierge",
        tag: "Year 1",
        body: "With 20 services, you would be on the $600 per month plan, alongside what the services themselves cost. What you stop doing: scheduling, chasing receipts, remembering due dates and vetting vendors.",
      },
    ],
  },
  {
    key: "how-to-use",
    title: "How to Use This Report",
    lede: "You do not need to read this front to back. Start anywhere, and use it the way you would use a good owner's manual.",
    sections: [
      {
        heading: "The five chapters",
        bullets: [
          "Information: the summary pages you are reading now.",
          "Interior Spaces: one page per room, with paint colors, flooring, fixtures and condition.",
          "Exterior Spaces: the roof, siding, windows, driveway, grounds and outdoor living areas.",
          "Systems & Appliances: every mechanical system and appliance, with model, serial, age and care history.",
          "Strategy: your ten-year plan, the six vision projects, recurring services and the maintenance calendar.",
        ],
      },
      {
        heading: "How condition words work",
        paragraphs: [
          "Every room and system carries one plain word. There are no scores or grades to decode.",
        ],
        bullets: [
          "Excellent: like new, nothing to do.",
          "Good: normal wear, routine care only.",
          "Fair: working, but aging or dated; worth a plan.",
          "Poor: failing; schedule the work.",
          "Critical: act now. Nothing in your home rates Critical.",
        ],
      },
      {
        heading: "How price tiers work",
        paragraphs: [
          "Projects and replacements are priced three ways: Essential solves the problem, Enhanced is what we would choose for this house, and Signature is the fully realized version. Every figure is a planning range, such as $14,000 - $18,000, not a quote. Ranges firm up into a fixed price once a scope is designed, and we never add projects together into one total, because you will not do them all at once.",
        ],
      },
    ],
    callout: {
      label: "How this report stays alive",
      body: "This is a living record, not a one-time document. When a filter is changed, a service is completed or a project is finished, the page updates. Bobby answers from this same record, so you can ask what paint is on the dining room walls or when the chimney was last swept and get your home's answer.",
    },
  },
];
