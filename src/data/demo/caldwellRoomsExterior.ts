// Caldwell demo: Exterior Envelope and Outdoor Living pages.
//
// Facts, keys and voice follow docs/demo/CALDWELL_DEMO_BIBLE.md. Envelope
// pages carry a headline measure in `dimensions` and no floorSqft. Finish
// fields are filled only where the label reads naturally for an exterior
// surface; everything else lives in the observations.

import type { DemoRoom } from "./caldwellTypes";

const ENVELOPE = "Exterior Envelope";
const OUTDOOR = "Outdoor Living";
const FLOOR = "Exterior";

export const caldwellExteriorRooms: DemoRoom[] = [
  // ─── Exterior Envelope ─────────────────────────────────────────────────
  {
    key: "roof",
    groupId: "exterior",
    title: "Roof",
    record: {
      roomName: "Roof",
      roomGroup: ENVELOPE,
      floorLabel: FLOOR,
      dimensions: "5,157 sqft roof area",
      ceiling: "",
      wallPaint: "",
      trimPaint: "Factory white aluminum fascia, soffit and gutters",
      ceilingPaint: "",
      conditionRating: "Fair",
      observationsHtml:
        "Your roof is the original 1998 architectural asphalt shingle, now 28 years old across 5,157 sqft of roof area. The dark shingles show visible granule wear, heaviest on the south and west slopes, but the valleys, the pipe boots and the step flashing at the brick masonry chimney are all sound, and we found no active leaks or staining in the attic. That chimney serves the wood-burning fireplace in your family room, and both its annual sweep by Brooks Chimney and the fall cleaning of the aluminum gutters are overdue. We would get those two visits done before winter, keep the roof inspected every year, and plan replacement in Year 4-5 with a ridge vent and new gutters in the same job.",
      linkedVisionProjects: [
        {
          id: "vision-roof-replacement",
          title: "Roof Replacement with Ventilation Upgrade",
          priority: "Year 4-5",
        },
      ],
    },
    conciergeAction: {
      title: "Gutter cleaning is overdue",
      body: "ClearFlow Exteriors cleans your gutters twice a year, and this fall's visit has not happened yet. Bobby can get it on the calendar before the first hard freeze.",
      prompt:
        "Schedule my overdue gutter cleaning with ClearFlow Exteriors before the first freeze.",
    },
  },
  {
    key: "siding-trim",
    groupId: "exterior",
    title: "Siding & Trim",
    record: {
      roomName: "Siding & Trim",
      roomGroup: ENVELOPE,
      floorLabel: FLOOR,
      dimensions: "4,831 sqft siding",
      ceiling: "",
      wallPaint: "Sherwin-Williams Extra White SW 7006, satin, on fiber cement lap siding",
      trimPaint: "Sherwin-Williams Extra White SW 7006; shutters in Tricorn Black SW 6258",
      ceilingPaint: "",
      conditionRating: "Good",
      observationsHtml:
        "Your siding is fiber cement lap, original to 1998 and last painted in 2019 in white with black shutters. The paint is holding well on three sides; the south elevation is starting to chalk, and the caulk has opened at a handful of window head trims and two corner boards. None of it is letting water in yet. We would recaulk those joints in the spring and expect the next full repaint to be a few years out.",
    },
  },
  {
    key: "windows-doors",
    groupId: "exterior",
    title: "Windows & Doors",
    record: {
      roomName: "Windows & Doors",
      roomGroup: ENVELOPE,
      floorLabel: FLOOR,
      dimensions: "68 windows",
      ceiling: "",
      wallPaint: "",
      trimPaint: "Sherwin-Williams Extra White SW 7006 on exterior casings",
      ceilingPaint: "",
      windows: "68 total: vinyl-clad wood with low-E insulated glass, original 1998; double-hung above grade, egress casements on the lower level",
      doors: "Fiberglass front entry with sidelights, hinged patio doors at the rear, 3 insulated steel overhead garage doors",
      conditionRating: "Good",
      observationsHtml:
        "All 68 windows are the original 1998 vinyl-clad wood units with low-E insulated glass: double-hung on the main and upper floors, egress casements on the lower level. They have aged well; sashes tilt and lock, balances hold and the exterior cladding is intact. We found one failed insulated-glass seal, in the guest bedroom (Bedroom 4), which shows as fogging between the panes and can be fixed by replacing the glass in that one sash rather than the whole window. The front entry and patio doors close tight on good weatherstripping, and the three insulated steel garage doors run smoothly.",
    },
  },
  {
    key: "driveway-walkways",
    groupId: "exterior",
    title: "Driveway & Walkways",
    record: {
      roomName: "Driveway & Walkways",
      roomGroup: ENVELOPE,
      floorLabel: FLOOR,
      dimensions: "2,400 sqft driveway",
      ceiling: "",
      wallPaint: "",
      trimPaint: "",
      ceilingPaint: "",
      flooring: "Asphalt driveway, original 1998; broom-finished concrete front walk",
      conditionRating: "Poor",
      observationsHtml:
        "Your driveway is the original 1998 asphalt, about 2,400 sqft, and it has reached the end of its life. Alligator cracking runs through both wheel paths, which tells us the stone base underneath has failed, and the asphalt has heaved at the apron where it meets the garage slab, leaving a lip that catches the plow and holds water against the doors. Sealcoating will not fix either problem. We would crack-fill the worst areas to get through this winter and plan a full replacement, with the front walkway rebuilt to match, in Year 3-5.",
      linkedVisionProjects: [
        {
          id: "vision-driveway",
          title: "Driveway Replacement & Front Walkway",
          priority: "Year 3-5",
        },
      ],
    },
  },
  {
    key: "landscape-grounds",
    groupId: "exterior",
    title: "Landscape & Grounds",
    record: {
      roomName: "Landscape & Grounds",
      roomGroup: ENVELOPE,
      floorLabel: FLOOR,
      dimensions: "1.4 wooded acres",
      ceiling: "",
      wallPaint: "",
      trimPaint: "",
      ceilingPaint: "",
      lightFixtures: "Low-voltage LED path and accent lighting on a timer",
      conditionRating: "Good",
      observationsHtml:
        "Your 1.4 acres are mostly mature oak and maple, with foundation beds across the front and a lawn that GreenScape Hudson mows weekly in season. The grade falls away from the foundation on all four sides and every downspout discharges well clear of the house, which is a big reason the lower level stays dry. Two oak limbs overhang the garage roof and should come back at Arbor North's next visit, since shade and leaf load are hard on 28-year-old shingles. The beds are freshly mulched and the plantings are healthy.",
    },
  },

  // ─── Outdoor Living ────────────────────────────────────────────────────
  {
    key: "front-porch",
    groupId: "exterior-structures",
    title: "Front Covered Porch",
    record: {
      roomName: "Front Covered Porch",
      roomGroup: OUTDOOR,
      floorLabel: FLOOR,
      dimensions: "8 × 28",
      floorSqft: 224,
      ceiling: "Tongue and groove",
      wallPaint: "Sherwin-Williams Extra White SW 7006, satin",
      trimPaint: "Sherwin-Williams Extra White SW 7006 on columns and railings",
      ceilingPaint: "Sherwin-Williams Extra White SW 7006 on tongue and groove boards",
      flooring: "Bluestone over concrete slab",
      lightFixtures: "2× flush-mount ceiling + 2× wall lantern at the entry",
      outlets: "2 total (both GFCI, weatherproof covers)",
      doors: "Front entry with sidelights",
      conditionRating: "Excellent",
      observationsHtml:
        "Your front porch is the face of the house, and it is in excellent shape. The bluestone is level with tight joints, the columns are plumb, and the tongue and groove ceiling is dry with no staining at the house wall. The one thing to watch is the caulk line at the base of each column, where splashback will eventually open the paint. We would touch up those joints whenever the trim is next painted.",
    },
  },
  {
    key: "rear-deck",
    groupId: "exterior-structures",
    title: "Rear Deck",
    record: {
      roomName: "Rear Deck",
      roomGroup: OUTDOOR,
      floorLabel: FLOOR,
      dimensions: "16 × 22",
      floorSqft: 352,
      ceiling: "Open",
      wallPaint: "",
      trimPaint: "White painted railings and balusters",
      ceilingPaint: "",
      flooring: "5/4 cedar decking on a pressure-treated frame, semi-transparent stain",
      lightFixtures: "2× wall lantern at the house + low-voltage stair lights",
      outlets: "2 total (both GFCI, weatherproof covers)",
      conditionRating: "Fair",
      observationsHtml:
        "Your rear deck is 5/4 cedar decking on a pressure-treated frame, and the frame is in good shape: posts are plumb, joists are solid and the stairs are tight. The cedar is where it needs help. The boards have weathered gray, the stain last applied in 2022 is gone, and two boards near the stairs are soft underfoot. We could not see flashing behind the ledger where the deck meets the house, so we want that verified when the soft boards come up, then the whole deck washed and stained before next summer.",
    },
    conciergeAction: {
      title: "Get the deck repaired and stained",
      body: "Two soft boards, a ledger flashing check, then a wash and a fresh coat of stain. Bobby can line up the carpenter and the finisher so it all happens in the right order.",
      prompt:
        "I want the two soft boards on the rear deck replaced, the ledger flashing checked, and the deck stained. Can you set that up?",
    },
  },
  {
    key: "screened-porch",
    groupId: "exterior-structures",
    title: "Screened Porch",
    record: {
      roomName: "Screened Porch",
      roomGroup: OUTDOOR,
      floorLabel: FLOOR,
      dimensions: "12 × 18",
      floorSqft: 216,
      ceiling: "Vaulted",
      wallPaint: "",
      trimPaint: "Sherwin-Williams Extra White SW 7006 on posts and screen frames",
      ceilingPaint: "Clear-sealed tongue and groove pine",
      flooring: "Composite decking on a pressure-treated frame",
      lightFixtures: "1× ceiling fan with light + 2× wall sconce",
      outlets: "3 total (all GFCI protected)",
      windows: "Fiberglass screen panels in aluminum frames on three sides",
      doors: "1 door to the house + 1 screen door to the rear deck",
      conditionRating: "Good",
      observationsHtml:
        "Your screened porch is a well-built three-season room with a vaulted pine ceiling, and it is Mark's favorite spot in the house from April through October. The roof, posts and floor framing are sound, the ceiling fan runs true, and one screen panel on the east side has a small tear at the corner. Because the walls are screen and the floor is open underneath, it sits empty for five months of the year. That is exactly what the four-season conversion solves, and the structure is a good candidate for it.",
      linkedVisionProjects: [
        {
          id: "vision-screened-porch",
          title: "Screened Porch: Four-Season Conversion",
          priority: "Year 2-4",
        },
      ],
    },
  },
  {
    key: "outdoor-kitchen",
    groupId: "exterior-structures",
    title: "Outdoor Kitchen",
    record: {
      roomName: "Outdoor Kitchen",
      roomGroup: OUTDOOR,
      floorLabel: FLOOR,
      dimensions: "10 × 14",
      floorSqft: 140,
      ceiling: "Cedar pergola",
      wallPaint: "",
      trimPaint: "",
      ceilingPaint: "",
      flooring: "Flagstone patio",
      lightFixtures: "String lights on the pergola",
      outlets: "2 total (both GFCI, weatherproof covers)",
      conditionRating: "Excellent",
      observationsHtml:
        "Your outdoor kitchen was built in 2020: a stacked-stone island with the Wolf built-in grill, an outdoor refrigerator and a sink, set on a flagstone patio under a cedar pergola with string lights and lounge seating alongside. The stonework is tight with no cracked joints, the gas connection tested leak-free, and the pergola posts are solid at the base. The cedar has started to silver and will want a clear sealer in the next year or two. Before the first hard freeze, the sink supply needs to be shut off and drained; Bobby can add that to your fall list.",
    },
    conciergeAction: {
      title: "Annual power washing is overdue",
      body: "The flagstone, the deck and the front walk are due for their yearly wash, a job you have been handling yourselves. Bobby can line up a crew so it is one less weekend project.",
      prompt:
        "Find someone to power wash the flagstone patio, the deck and the walks, and get it scheduled.",
    },
  },
  {
    key: "hot-tub-patio",
    groupId: "exterior-structures",
    title: "Hot Tub Patio",
    record: {
      roomName: "Hot Tub Patio",
      roomGroup: OUTDOOR,
      floorLabel: FLOOR,
      dimensions: "12 × 14",
      floorSqft: 168,
      ceiling: "Open",
      wallPaint: "",
      trimPaint: "",
      ceilingPaint: "",
      flooring: "Flagstone surround on a reinforced concrete pad",
      lightFixtures: "Low-voltage path lights",
      outlets: "50A 240V GFCI spa disconnect + 1 GFCI receptacle",
      conditionRating: "Excellent",
      observationsHtml:
        "Your hot tub patio was built in 2021 for the Sundance Optima: a reinforced concrete pad under the tub with a flagstone surround that matches the outdoor kitchen. The pad is level with no settlement, water drains away from the house, and the spa disconnect is mounted in sight of the tub at the proper distance. The cover and lifter are in good shape. Sundance Service handles the water care and filters every quarter, so there is very little for you to do here but use it.",
    },
    conciergeAction: {
      title: "Keep the hot tub on schedule",
      body: "Sundance Service visits quarterly for water care, filters and a cover check. Bobby can confirm the next visit and add a winter cover inspection while they are here.",
      prompt:
        "Confirm my next quarterly hot tub service with Sundance Service and ask them to check the cover before winter.",
    },
  },
];
