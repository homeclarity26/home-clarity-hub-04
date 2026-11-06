// The 17 appliances of the Caldwell demo home (Systems & Appliances chapter).
//
// Identity facts (make, model, serial, install date, lifespan, age) come
// from docs/demo/CALDWELL_DEMO_BIBLE.md and must not drift from it.
// Replacement ranges are installed, whole-dollar, 2026 pricing for these
// brands. Photos are placed by caldwellHome's photo map, so every record
// leaves `photos` empty and `imageUrl` unset.

import type { ReplacementBriefingTier } from "@/components/wysiwyg/types";
import type { DemoSystem } from "./caldwellTypes";

type TierInput = [low: number, high: number, scope: string];

/** Three ascending tiers; Enhanced is the recommended one. */
function tiers(
  essential: TierInput,
  enhanced: TierInput,
  signature: TierInput,
): ReplacementBriefingTier[] {
  return [
    {
      id: "essential",
      label: "Essential",
      priceLow: essential[0],
      priceHigh: essential[1],
      scopeHtml: essential[2],
      recommended: false,
    },
    {
      id: "enhanced",
      label: "Enhanced",
      priceLow: enhanced[0],
      priceHigh: enhanced[1],
      scopeHtml: enhanced[2],
      recommended: true,
    },
    {
      id: "signature",
      label: "Signature",
      priceLow: signature[0],
      priceHigh: signature[1],
      scopeHtml: signature[2],
      recommended: false,
    },
  ];
}

export const caldwellAppliances: DemoSystem[] = [
  // ── Kitchen ────────────────────────────────────────────────────────────
  {
    key: "refrigerator",
    groupId: "appliances",
    title: "Refrigerator",
    ageYears: 9,
    record: {
      systemName: "Refrigerator",
      category: "Appliance",
      isAppliance: true,
      status: "Healthy",
      make: "Sub-Zero",
      model: "BI-48S/O",
      serial: "SZ-2017-44291",
      installDate: "2017-04",
      typicalLifespanYears: 20,
      conditionRating: "Good",
      specifications: [
        { label: "Size", value: "48 in. built-in, side-by-side, about 29 cu ft" },
        { label: "Finish", value: "Overlay panels matched to the kitchen cabinetry" },
        { label: "Cooling", value: "Dual compressors, separate refrigerator and freezer systems" },
        { label: "Water and ice", value: "Filtered water dispenser and automatic ice maker" },
        { label: "Power", value: "115V, dedicated circuit" },
        { label: "Location", value: "Kitchen, tall cabinet run" },
      ],
      maintenanceLog: [
        {
          date: "2026-11-02",
          description:
            "Water dispenser service visit requested through Bobby; appointment pending.",
        },
        {
          date: "2026-06-10",
          description: "Condenser vacuumed; door gaskets wiped down and checked.",
        },
        {
          date: "2026-03-12",
          description: "Water filter and air purification cartridge replaced.",
          cost: 140,
        },
      ],
      routineCareItems: [
        {
          description: "Replace the water filter and the air purification cartridge",
          frequencyMonths: 12,
          lastDoneDate: "2026-03-12",
        },
        {
          description: "Vacuum the condenser behind the top grille",
          frequencyMonths: 6,
          lastDoneDate: "2026-06-10",
        },
        {
          description: "Wipe the door gaskets and check the seal",
          frequencyMonths: 3,
          lastDoneDate: "2026-09-05",
        },
      ],
      photos: {},
    },
    observations: [
      "Your 48-inch Sub-Zero is nine years into a twenty-year life. Both sides hold temperature, and the panels and hinges are tight.",
      "The water dispenser has been intermittent. That usually traces to the filter head or the inlet valve, not the refrigeration itself, and a service visit is already pending through Bobby.",
      "Keep the condenser clean twice a year. It is the single best thing you can do for a built-in.",
    ],
    briefingSystemType: "Refrigerator",
    briefingTiers: tiers(
      [
        11000,
        14000,
        "A 48-inch built-in side-by-side from a value-premium brand, installed in the existing opening with new panels fitted.",
      ],
      [
        17000,
        21000,
        "Like-for-like: the current 48-inch Sub-Zero built-in with dual compressors, installed in the same opening with your overlay panels refitted.",
      ],
      [
        24000,
        30000,
        "A Sub-Zero column pair or PRO 48 with new custom panels and the cabinet adjustments needed to make it look built for the room.",
      ],
    ),
  },
  {
    key: "range",
    groupId: "appliances",
    title: "Range",
    ageYears: 9,
    record: {
      systemName: "Range",
      category: "Appliance",
      isAppliance: true,
      status: "Healthy",
      make: "Wolf",
      model: "DF486G",
      serial: "WF-2017-22841",
      installDate: "2017-04",
      typicalLifespanYears: 20,
      conditionRating: "Excellent",
      specifications: [
        { label: "Size", value: "48 in. dual-fuel range" },
        { label: "Cooktop", value: "Six dual-stacked sealed gas burners plus an infrared griddle" },
        { label: "Ovens", value: "Two electric convection ovens, about 4.5 and 2.5 cu ft" },
        { label: "Fuel and power", value: "Natural gas cooktop; 240V oven circuit" },
        { label: "Location", value: "Kitchen, range wall" },
      ],
      maintenanceLog: [
        {
          date: "2025-11-14",
          description:
            "Burner igniters cleaned and oven temperature calibration verified ahead of the holidays.",
          cost: 210,
        },
        {
          date: "2024-02-20",
          description: "Griddle re-seasoned and one burner cap reseated; no parts needed.",
        },
      ],
      routineCareItems: [
        {
          description: "Clean the burner caps, ports and igniters",
          frequencyMonths: 3,
          lastDoneDate: "2026-09-12",
        },
        {
          description: "Clean and re-season the griddle; empty the grease tray",
          frequencyMonths: 1,
          lastDoneDate: "2026-10-25",
        },
        {
          description: "Verify oven calibration and inspect the door gaskets",
          frequencyMonths: 12,
          lastDoneDate: "2025-11-14",
        },
      ],
      photos: {},
    },
    observations: [
      "The Wolf is the workhorse of your kitchen and shows almost no wear. The grates sit flat, the knobs turn cleanly, and all six burners light on the first click.",
      "Both ovens hold temperature and the door gaskets are intact. At nine of twenty years there is nothing to plan for here.",
    ],
    briefingSystemType: "Range",
    briefingTiers: tiers(
      [
        11000,
        14000,
        "A 48-inch dual-fuel professional range from a value-premium brand, connected to the existing gas line and 240V circuit.",
      ],
      [
        16000,
        19000,
        "Like-for-like: the current Wolf 48-inch dual-fuel range with six burners and griddle, set in the same opening on the existing gas and electric.",
      ],
      [
        21000,
        26000,
        "A 48-inch range in a specialty configuration or custom finish, such as a French top, with gas and electrical adjustments included.",
      ],
    ),
  },
  {
    key: "wall-oven",
    groupId: "appliances",
    title: "Built-In Wall Oven",
    ageYears: 9,
    record: {
      systemName: "Built-In Wall Oven",
      category: "Appliance",
      isAppliance: true,
      status: "Healthy",
      make: "Wolf",
      model: "DO30PE",
      serial: "WF-2017-22842",
      installDate: "2017-04",
      typicalLifespanYears: 20,
      conditionRating: "Excellent",
      specifications: [
        { label: "Size", value: "30 in. double wall oven, E Series" },
        { label: "Capacity", value: "4.5 cu ft per oven" },
        { label: "Cooking", value: "Dual convection upper oven, temperature probe, self-clean" },
        { label: "Power", value: "240V, dedicated circuit" },
        { label: "Location", value: "Kitchen, tall oven cabinet" },
      ],
      maintenanceLog: [
        {
          date: "2025-11-14",
          description:
            "Door gaskets inspected and temperature calibration verified on both ovens, same visit as the range.",
        },
        {
          date: "2023-12-05",
          description: "Upper oven lamp replaced.",
          cost: 45,
        },
      ],
      routineCareItems: [
        {
          description: "Run the self-clean cycle on each oven",
          frequencyMonths: 6,
          lastDoneDate: "2026-08-02",
        },
        {
          description: "Wipe the door gaskets and check the hinges",
          frequencyMonths: 6,
          lastDoneDate: "2026-08-02",
        },
      ],
      photos: {},
    },
    observations: [
      "Between the range and this double oven you have four ovens, and these two see the lighter duty. Interiors are clean and the doors close square.",
      "No concerns. Keep running self-clean twice a year so buildup never bakes onto the porcelain.",
    ],
    briefingSystemType: "Wall Oven",
    briefingTiers: tiers(
      [
        5500,
        7000,
        "A 30-inch double wall oven from a value-premium brand, trimmed to fit the existing cabinet cutout.",
      ],
      [
        9500,
        11500,
        "Like-for-like: the current Wolf E Series 30-inch double oven, installed in the same cutout on the existing circuit.",
      ],
      [
        13000,
        16000,
        "A Wolf M Series double oven with upgraded convection, including the cabinet cutout modifications it needs.",
      ],
    ),
  },
  {
    key: "dishwasher",
    groupId: "appliances",
    title: "Dishwasher",
    ageYears: 9,
    record: {
      systemName: "Dishwasher",
      category: "Appliance",
      isAppliance: true,
      status: "Approaching End-of-Life",
      make: "Cove",
      model: "DW2450",
      serial: "CV-2017-1187",
      installDate: "2017-04",
      typicalLifespanYears: 12,
      conditionRating: "Fair",
      specifications: [
        { label: "Size", value: "24 in. built-in, panel-ready front" },
        { label: "Capacity", value: "16 place settings on three racks" },
        { label: "Features", value: "Three spray arms, interior LED lighting, adjustable racks" },
        { label: "Power", value: "120V" },
        { label: "Location", value: "Kitchen, beside the main sink" },
      ],
      maintenanceLog: [
        {
          date: "2026-04-22",
          description:
            "Drain pump cleared and lower spray arm cleaned after water was left standing in the tub.",
          cost: 245,
        },
        {
          date: "2024-10-09",
          description: "Door gasket and lower rack wheels replaced.",
          cost: 310,
        },
      ],
      routineCareItems: [
        {
          description: "Clean the filter and the spray arm jets",
          frequencyMonths: 1,
          lastDoneDate: "2026-10-18",
        },
        {
          description: "Run a dishwasher cleaner cycle",
          frequencyMonths: 3,
          lastDoneDate: "2026-09-06",
        },
      ],
      photos: {},
    },
    observations: [
      "At nine of twelve years, this is one of two appliances in your home nearing the end of its run. It still cleans well, but it has needed two repair visits since 2024 and cycles run longer than they used to.",
      "Our advice: do not put another major repair into it. If the kitchen refresh goes ahead, replace it while the counters are off; your cabinet panel can be reused.",
    ],
    briefingSystemType: "Dishwasher",
    briefingTiers: tiers(
      [
        1500,
        2000,
        "A quiet, panel-ready 24-inch dishwasher from a value-premium brand, with your existing cabinet panel refitted.",
      ],
      [
        2400,
        3000,
        "Like-for-like: the current Cove 24-inch panel-ready dishwasher, installed on the existing water, drain and power with your panel reused.",
      ],
      [
        3200,
        3900,
        "A top-of-line panel-ready dishwasher with automatic detergent dosing, a new custom panel and new supply and drain lines.",
      ],
    ),
  },
  {
    key: "microwave-drawer",
    groupId: "appliances",
    title: "Microwave Drawer",
    ageYears: 9,
    record: {
      systemName: "Microwave Drawer",
      category: "Appliance",
      isAppliance: true,
      status: "Approaching End-of-Life",
      make: "Sharp",
      model: "SMD2470AS",
      serial: "SH-2017-77231",
      installDate: "2017-04",
      typicalLifespanYears: 10,
      conditionRating: "Fair",
      specifications: [
        { label: "Size", value: "24 in. drawer microwave" },
        { label: "Capacity", value: "1.2 cu ft" },
        { label: "Power", value: "950 watts cooking power; 120V" },
        { label: "Features", value: "Motorized drawer, sensor cooking, stainless front" },
        { label: "Location", value: "Kitchen, island" },
      ],
      maintenanceLog: [
        {
          date: "2025-05-13",
          description:
            "Drawer track cleaned and lubricated after the drawer began stalling on open.",
          cost: 165,
        },
      ],
      routineCareItems: [
        {
          description: "Wipe the interior, the door seal and the waveguide cover",
          frequencyMonths: 1,
          lastDoneDate: "2026-10-20",
        },
        {
          description: "Wipe the drawer tracks clean",
          frequencyMonths: 3,
          lastDoneDate: "2026-08-20",
        },
      ],
      photos: {},
    },
    observations: [
      "Nine years into a ten-year life. The drawer motor hesitates on opening and the keypad needs a firm press; both are typical end-of-life signs for a drawer microwave.",
      "It is safe to keep using. Plan a replacement in the next year, and pair it with the kitchen refresh if the timing lines up: the opening is a standard 24-inch drawer cutout.",
    ],
    briefingSystemType: "Microwave Drawer",
    briefingTiers: tiers(
      [
        1300,
        1700,
        "Like-for-like: the current Sharp 24-inch drawer microwave in the existing island cutout.",
      ],
      [
        1800,
        2300,
        "An upgraded 24-inch drawer with hands-free opening and a quieter glide, on the existing circuit.",
      ],
      [
        2600,
        3200,
        "A Wolf 24-inch drawer microwave to match the range and wall oven, with trim fitted to the island cutout.",
      ],
    ),
  },
  {
    key: "range-hood",
    groupId: "appliances",
    title: "Range Hood",
    ageYears: 9,
    record: {
      systemName: "Range Hood",
      category: "Appliance",
      isAppliance: true,
      status: "Healthy",
      make: "Wolf",
      model: "PW362210",
      serial: "WF-2017-99812",
      installDate: "2017-04",
      typicalLifespanYears: 20,
      conditionRating: "Good",
      specifications: [
        { label: "Type", value: "Pro wall hood, stainless steel" },
        { label: "Blower", value: "Internal blower with variable speed control" },
        { label: "Filters", value: "Stainless baffle filters, dishwasher safe" },
        { label: "Lighting", value: "Dimmable halogen task lighting" },
        { label: "Ducting", value: "Vented to the exterior" },
        { label: "Location", value: "Kitchen, range wall above the range" },
      ],
      maintenanceLog: [
        {
          date: "2026-02-18",
          description: "Baffle filters and grease channel deep cleaned.",
        },
        {
          date: "2024-08-27",
          description: "Two halogen lamps replaced.",
          cost: 38,
        },
      ],
      routineCareItems: [
        {
          description: "Run the baffle filters through the dishwasher",
          frequencyMonths: 1,
          lastDoneDate: "2026-10-12",
        },
        {
          description: "Wipe the grease channel and the stainless canopy",
          frequencyMonths: 3,
          lastDoneDate: "2026-09-12",
        },
        {
          description: "Check that the exterior vent damper opens and closes freely",
          frequencyMonths: 12,
          lastDoneDate: "2026-04-11",
        },
      ],
      photos: {},
    },
    observations: [
      "The hood pulls strongly at every speed with no rattle in the blower, and the stainless has been kept clean.",
      "Hoods rarely fail; they clog. Keep the baffle filters on a monthly dishwasher cycle and this one will outlast the range beneath it.",
    ],
    briefingSystemType: "Range Hood",
    briefingTiers: tiers(
      [
        2800,
        3800,
        "A professional-style stainless wall hood with an internal blower, connected to the existing duct.",
      ],
      [
        4500,
        6000,
        "Like-for-like: a Wolf pro wall hood with internal blower, mounted at the same height on the existing duct and wiring.",
      ],
      [
        7500,
        10000,
        "A custom hood surround with a Wolf liner and a remote blower for quieter operation, including duct and makeup-air adjustments.",
      ],
    ),
  },
  {
    key: "wine-fridge",
    groupId: "appliances",
    title: "Wine Refrigerator",
    ageYears: 9,
    record: {
      systemName: "Wine Refrigerator",
      category: "Appliance",
      isAppliance: true,
      status: "Healthy",
      make: "Sub-Zero",
      model: "424G",
      serial: "SZ-2017-44292",
      installDate: "2017-04",
      typicalLifespanYears: 15,
      conditionRating: "Excellent",
      specifications: [
        { label: "Size", value: "24 in. undercounter wine storage" },
        { label: "Capacity", value: "46 bottles" },
        { label: "Zones", value: "Two independent temperature zones" },
        { label: "Door", value: "UV-resistant glass" },
        { label: "Power", value: "115V" },
        { label: "Location", value: "Kitchen, undercounter" },
      ],
      maintenanceLog: [
        {
          date: "2026-06-10",
          description:
            "Condenser vacuumed behind the kickplate; both zones verified at set temperature.",
        },
      ],
      routineCareItems: [
        {
          description: "Vacuum the condenser behind the kickplate",
          frequencyMonths: 6,
          lastDoneDate: "2026-06-10",
        },
        {
          description: "Wipe the door gasket and check the seal",
          frequencyMonths: 6,
          lastDoneDate: "2026-06-10",
        },
      ],
      photos: {},
    },
    observations: [
      "Both zones hold steady and the unit runs quietly. The racks glide and the door seal is tight all the way around.",
      "Nothing to do beyond the twice-a-year condenser cleaning it already gets with the main refrigerator.",
    ],
    briefingSystemType: "Wine Refrigerator",
    briefingTiers: tiers(
      [
        2200,
        3000,
        "A 24-inch dual-zone undercounter wine refrigerator from a value-premium brand in the existing opening.",
      ],
      [
        5200,
        6400,
        "Like-for-like: a Sub-Zero 24-inch undercounter wine storage unit with two zones, installed in the same opening.",
      ],
      [
        11000,
        14000,
        "A move up to a tall Sub-Zero 24-inch wine column holding about 100 bottles, including the cabinetry changes to house it.",
      ],
    ),
  },
  {
    key: "kitchen-ice-maker",
    groupId: "appliances",
    title: "Ice Maker: Kitchen",
    ageYears: 9,
    record: {
      systemName: "Ice Maker: Kitchen",
      category: "Appliance",
      isAppliance: true,
      status: "Healthy",
      make: "Sub-Zero",
      model: "UC-15I",
      serial: "SZ-2017-44293",
      installDate: "2017-04",
      typicalLifespanYears: 12,
      conditionRating: "Good",
      specifications: [
        { label: "Size", value: "15 in. undercounter, panel-ready" },
        { label: "Ice", value: "Clear ice, up to 50 lb per day" },
        { label: "Storage", value: "25 lb bin" },
        { label: "Connections", value: "Dedicated water line and drain" },
        { label: "Power", value: "115V" },
        { label: "Location", value: "Kitchen, undercounter beside the wine refrigerator" },
      ],
      maintenanceLog: [
        {
          date: "2026-05-19",
          description: "Clean and sanitize cycle run; inlet water filter replaced.",
          cost: 95,
        },
        {
          date: "2024-11-12",
          description: "Descaled and drain line flushed.",
        },
      ],
      routineCareItems: [
        {
          description: "Run the clean and sanitize cycle",
          frequencyMonths: 6,
          lastDoneDate: "2026-05-19",
        },
        {
          description: "Replace the inlet water filter",
          frequencyMonths: 12,
          lastDoneDate: "2026-05-19",
        },
      ],
      photos: {},
    },
    observations: [
      "Clear-ice machines ask for more care than anything else in a kitchen, and yours has been getting it. The cubes come out clear and full, and the bin drains properly.",
      "At nine of twelve years it is in its later years but showing no symptoms. Stay on the six-month cleaning cycle; softened water from your Kinetico helps here.",
    ],
    briefingSystemType: "Ice Maker",
    briefingTiers: tiers(
      [
        2600,
        3400,
        "A 15-inch undercounter clear-ice machine from a value-premium brand on the existing water line and drain.",
      ],
      [
        5000,
        6200,
        "Like-for-like: a Sub-Zero 15-inch clear-ice maker with your cabinet panel refitted, on the existing water line and drain.",
      ],
      [
        6500,
        7800,
        "A Sub-Zero clear-ice maker with a drain pump, upgraded inline filtration and a new custom panel.",
      ],
    ),
  },

  // ── Laundry Room ───────────────────────────────────────────────────────
  {
    key: "washer",
    groupId: "appliances",
    title: "Washer",
    ageYears: 7,
    record: {
      systemName: "Washer",
      category: "Appliance",
      isAppliance: true,
      status: "Healthy",
      make: "Electrolux",
      model: "EFLS627UTT",
      serial: "EL-2019-66421",
      installDate: "2019-09",
      typicalLifespanYears: 12,
      conditionRating: "Excellent",
      specifications: [
        { label: "Size", value: "27 in. front-load, titanium finish" },
        { label: "Capacity", value: "4.4 cu ft" },
        { label: "Features", value: "SmartBoost detergent premixing, steam, 15-minute fast wash" },
        { label: "Spin", value: "Up to 1,300 rpm" },
        { label: "Power", value: "120V" },
        { label: "Location", value: "Laundry Room, beside the dryer" },
      ],
      maintenanceLog: [
        {
          date: "2026-07-19",
          description: "Drain pump filter cleaned; door boot inspected, no tears or mildew.",
        },
        {
          date: "2024-03-15",
          description: "Detergent drawer and housing cleaned; supply hose screens rinsed.",
        },
      ],
      routineCareItems: [
        {
          description: "Clean the drain pump filter",
          frequencyMonths: 6,
          lastDoneDate: "2026-07-19",
        },
        {
          description: "Run the clean washer cycle",
          frequencyMonths: 3,
          lastDoneDate: "2026-09-14",
        },
        {
          description: "Wipe the door boot and leave the door ajar between loads",
          frequencyMonths: 1,
          lastDoneDate: "2026-10-26",
        },
      ],
      photos: {},
    },
    observations: [
      "Seven years into a twelve-year life and running well. The drum spins true at full speed with no vibration, and the supply hoses are braided stainless with no corrosion at the fittings.",
      "With a family of four it works hard. The door boot is clean and the detergent drawer is free of residue, which tells us it is being looked after.",
    ],
    briefingSystemType: "Washer",
    briefingTiers: tiers(
      [
        900,
        1200,
        "A reliable full-size front-load washer, delivered, connected and leveled, with the old unit hauled away.",
      ],
      [
        1400,
        1900,
        "Like-for-like: a current Electrolux front-load washer with steam and detergent premixing, delivered, connected and leveled, with new braided supply hoses.",
      ],
      [
        2200,
        2900,
        "A top-of-line front-load washer with automatic detergent dosing, plus a drain pan and a leak-detection shutoff valve.",
      ],
    ),
  },
  {
    key: "dryer",
    groupId: "appliances",
    title: "Dryer",
    ageYears: 7,
    record: {
      systemName: "Dryer",
      category: "Appliance",
      isAppliance: true,
      status: "Healthy",
      make: "Electrolux",
      model: "EFME627UTT",
      serial: "EL-2019-66422",
      installDate: "2019-09",
      typicalLifespanYears: 13,
      conditionRating: "Good",
      specifications: [
        { label: "Size", value: "27 in. front-load, matched to the washer" },
        { label: "Capacity", value: "8.0 cu ft" },
        { label: "Drying", value: "Moisture sensing with steam refresh" },
        { label: "Fuel and power", value: "Electric; 240V, 30A circuit" },
        { label: "Venting", value: "Vented, 4 in. duct to an exterior hood" },
        { label: "Location", value: "Laundry Room, beside the washer" },
      ],
      maintenanceLog: [
        {
          date: "2026-07-19",
          description: "Lint screen washed and the screen housing vacuumed.",
        },
        {
          date: "2025-08-16",
          description: "Dryer vent run brushed out from the exterior hood (self-managed).",
        },
      ],
      routineCareItems: [
        {
          description: "Clear the lint screen after every load; wash it monthly",
          frequencyMonths: 1,
          lastDoneDate: "2026-10-26",
        },
        {
          description: "Clean the dryer vent run to the exterior hood",
          frequencyMonths: 12,
          lastDoneDate: "2025-08-16",
        },
      ],
      photos: {},
    },
    observations: [
      "The dryer itself is in good shape at seven of thirteen years: the drum turns quietly and loads dry evenly.",
      "The item to act on is the vent, not the machine. The exterior vent run is overdue for cleaning, and lint is visible at the exterior hood.",
      "A clogged vent makes the dryer run longer and hotter than it should. It is a short visit to fix, and Bobby can book it.",
    ],
    briefingSystemType: "Dryer",
    briefingTiers: tiers(
      [
        900,
        1200,
        "A reliable full-size vented electric dryer, delivered, connected to the existing vent and tested, with the old unit hauled away.",
      ],
      [
        1400,
        1900,
        "Like-for-like: a current Electrolux vented electric dryer with steam, matched to your washer, with a new rigid vent connector.",
      ],
      [
        2300,
        3000,
        "A top-of-line matched dryer, plus the vent run cleaned and rebuilt in rigid metal duct with a new exterior hood.",
      ],
    ),
  },

  // ── Wet Bar ────────────────────────────────────────────────────────────
  {
    key: "beverage-center",
    groupId: "appliances",
    title: "Beverage Center",
    ageYears: 9,
    record: {
      systemName: "Beverage Center",
      category: "Appliance",
      isAppliance: true,
      status: "Healthy",
      make: "Sub-Zero",
      model: "424FS",
      serial: "SZ-2017-44294",
      installDate: "2017-04",
      typicalLifespanYears: 15,
      conditionRating: "Good",
      specifications: [
        { label: "Size", value: "24 in. undercounter, stainless cabinet" },
        { label: "Storage", value: "Two temperature zones for wine and bottled drinks" },
        { label: "Door", value: "UV-resistant glass" },
        { label: "Power", value: "115V" },
        { label: "Location", value: "Wet Bar, lower level" },
      ],
      maintenanceLog: [
        {
          date: "2026-06-10",
          description: "Condenser vacuumed and door gasket cleaned.",
        },
        {
          date: "2023-10-03",
          description: "Interior light switch replaced.",
          cost: 120,
        },
      ],
      routineCareItems: [
        {
          description: "Vacuum the condenser behind the kickplate",
          frequencyMonths: 6,
          lastDoneDate: "2026-06-10",
        },
        {
          description: "Wipe the door gasket and check the seal",
          frequencyMonths: 6,
          lastDoneDate: "2026-06-10",
        },
      ],
      photos: {},
    },
    observations: [
      "This unit keeps the wet bar stocked for the rec room and it gets opened constantly. It holds temperature, and the gasket still seals well.",
      "The stainless shows light scuffing at kid height, which is cosmetic. No action needed.",
    ],
    briefingSystemType: "Beverage Center",
    briefingTiers: tiers(
      [
        2000,
        2800,
        "A 24-inch undercounter beverage center from a value-premium brand in the existing bar opening.",
      ],
      [
        4800,
        6000,
        "Like-for-like: a Sub-Zero 24-inch undercounter beverage center in stainless, installed in the same opening.",
      ],
      [
        6500,
        8000,
        "A panel-ready Sub-Zero beverage center with a custom front matched to the bar cabinetry.",
      ],
    ),
  },
  {
    key: "bar-ice-maker",
    groupId: "appliances",
    title: "Ice Maker: Wet Bar",
    ageYears: 8,
    record: {
      systemName: "Ice Maker: Wet Bar",
      category: "Appliance",
      isAppliance: true,
      status: "Healthy",
      make: "U-Line",
      model: "ULN-CLR1215",
      serial: "UL-2018-22817",
      installDate: "2018-03",
      typicalLifespanYears: 12,
      conditionRating: "Good",
      specifications: [
        { label: "Size", value: "15 in. undercounter" },
        { label: "Ice", value: "Clear ice, up to 60 lb per day" },
        { label: "Storage", value: "30 lb bin" },
        { label: "Connections", value: "Dedicated water line and drain" },
        { label: "Power", value: "115V" },
        { label: "Location", value: "Wet Bar, lower level" },
      ],
      maintenanceLog: [
        {
          date: "2026-05-19",
          description: "Clean and sanitize cycle run, same day as the kitchen ice maker.",
        },
        {
          date: "2023-09-08",
          description: "Water inlet valve replaced.",
          cost: 220,
        },
      ],
      routineCareItems: [
        {
          description: "Run the clean and sanitize cycle",
          frequencyMonths: 6,
          lastDoneDate: "2026-05-19",
        },
        {
          description: "Check the drain line for slow flow",
          frequencyMonths: 6,
          lastDoneDate: "2026-05-19",
        },
      ],
      photos: {},
    },
    observations: [
      "Eight years into a twelve-year life and making clear, full cubes. The inlet valve was replaced in 2023 and it has been trouble-free since.",
      "Because it sits on the lower level, the drain is the part to watch. If you ever see water in the bin, stop using it and tell Bobby.",
    ],
    briefingSystemType: "Ice Maker",
    briefingTiers: tiers(
      [
        1900,
        2500,
        "A 15-inch undercounter ice maker producing standard cubes, on the existing water line and drain.",
      ],
      [
        3400,
        4200,
        "Like-for-like: a U-Line 15-inch clear-ice machine with a new drain pump, in the existing bar opening.",
      ],
      [
        5000,
        6200,
        "A Sub-Zero 15-inch clear-ice maker to match the kitchen unit, with a drain pump and inline filtration.",
      ],
    ),
  },

  // ── Outdoor Kitchen ────────────────────────────────────────────────────
  {
    key: "built-in-grill",
    groupId: "appliances",
    title: "Built-In Grill",
    ageYears: 6,
    record: {
      systemName: "Built-In Grill",
      category: "Appliance",
      isAppliance: true,
      status: "Healthy",
      make: "Wolf",
      model: "OG36",
      serial: "WF-2020-77821",
      installDate: "2020-05",
      typicalLifespanYears: 18,
      conditionRating: "Excellent",
      specifications: [
        { label: "Size", value: "36 in. built-in gas grill" },
        { label: "Fuel", value: "Natural gas, hard piped on the 2020 permitted gas line" },
        { label: "Burners", value: "Three grilling burners including a sear zone, plus a rotisserie burner" },
        { label: "Construction", value: "Heavy-gauge stainless steel with a double-wall hood" },
        { label: "Location", value: "Outdoor Kitchen, stacked-stone island under the pergola" },
      ],
      maintenanceLog: [
        {
          date: "2026-04-25",
          description:
            "Spring start-up: burners and briquette trays cleaned, igniters tested, gas connection leak checked.",
          cost: 195,
        },
        {
          date: "2024-05-04",
          description: "Rotisserie igniter replaced.",
          cost: 120,
        },
      ],
      routineCareItems: [
        {
          description: "Spring start-up: deep clean, igniter test and gas leak check",
          frequencyMonths: 12,
          lastDoneDate: "2026-04-25",
        },
        {
          description: "Brush the grates and empty the drip tray",
          frequencyMonths: 1,
          lastDoneDate: "2026-10-10",
        },
        {
          description: "Cover the grill once it cools, and keep it covered through winter",
        },
      ],
      photos: {},
    },
    observations: [
      "Six years outdoors and the stainless is clean with no pitting. All burners light and the hood spring still lifts easily.",
      "The gas connection was leak checked this spring. Keep the cover on between uses; the pergola gives shade, not weather protection.",
    ],
    briefingSystemType: "Built-In Grill",
    briefingTiers: tiers(
      [
        3800,
        5000,
        "A 36-inch built-in stainless gas grill from a value-premium brand, fitted to the existing island cutout and gas stub.",
      ],
      [
        7800,
        9500,
        "Like-for-like: a Wolf 36-inch outdoor gas grill with sear zone and rotisserie, in the existing cutout on the existing gas line.",
      ],
      [
        11000,
        14000,
        "A 42-inch Wolf grill with the stone island cutout enlarged and refinished to suit.",
      ],
    ),
  },
  {
    key: "outdoor-refrigerator",
    groupId: "appliances",
    title: "Outdoor Refrigerator",
    ageYears: 6,
    record: {
      systemName: "Outdoor Refrigerator",
      category: "Appliance",
      isAppliance: true,
      status: "Healthy",
      make: "Sub-Zero",
      model: "424G/O",
      serial: "SZ-2020-77822",
      installDate: "2020-05",
      typicalLifespanYears: 12,
      conditionRating: "Good",
      specifications: [
        { label: "Size", value: "24 in. undercounter" },
        { label: "Door", value: "Glass door in an overlay frame" },
        { label: "Power", value: "115V, GFCI-protected circuit" },
        { label: "Seasonal use", value: "Emptied and shut down each winter" },
        { label: "Location", value: "Outdoor Kitchen, stacked-stone island" },
      ],
      maintenanceLog: [
        {
          date: "2026-10-24",
          description: "Emptied, cleaned and shut down for winter.",
        },
        {
          date: "2026-04-25",
          description: "Restarted for the season; condenser vacuumed and gasket cleaned.",
        },
      ],
      routineCareItems: [
        {
          description: "Empty, clean and shut down for winter",
          frequencyMonths: 12,
          lastDoneDate: "2026-10-24",
        },
        {
          description: "Vacuum the condenser and clean the gasket at spring start-up",
          frequencyMonths: 12,
          lastDoneDate: "2026-04-25",
        },
      ],
      photos: {},
    },
    observations: [
      "Halfway through a twelve-year life, which is a fair expectation for refrigeration that lives outside. It cooled well all season and the door gasket is still soft.",
      "It is already shut down for winter. Starting it back up in spring with a clean condenser is what keeps the compressor from working harder than it should.",
    ],
    briefingSystemType: "Outdoor Refrigerator",
    briefingTiers: tiers(
      [
        2200,
        3000,
        "A 24-inch outdoor-rated undercounter refrigerator from a value-premium brand in the existing island opening.",
      ],
      [
        5000,
        6200,
        "A Sub-Zero 24-inch outdoor-rated undercounter refrigerator, installed in the existing opening on the existing circuit.",
      ],
      [
        7500,
        9500,
        "Sub-Zero outdoor refrigerator drawers with the stone opening reworked to fit and a new weatherproof outlet.",
      ],
    ),
  },
  {
    key: "outdoor-sink",
    groupId: "appliances",
    title: "Outdoor Sink",
    ageYears: 6,
    record: {
      systemName: "Outdoor Sink",
      category: "Appliance",
      isAppliance: true,
      status: "Healthy",
      make: "Bull",
      model: "32500",
      serial: "BL-2020-77823",
      installDate: "2020-05",
      typicalLifespanYears: 20,
      conditionRating: "Good",
      specifications: [
        { label: "Type", value: "Drop-in bar sink with faucet" },
        { label: "Material", value: "Stainless steel" },
        { label: "Supply", value: "Water line with an interior shutoff for winterizing" },
        { label: "Seasonal use", value: "Shut off and drained each fall" },
        { label: "Location", value: "Outdoor Kitchen, stacked-stone island" },
      ],
      maintenanceLog: [
        {
          date: "2026-10-24",
          description: "Supply shut off at the interior valve and lines drained for winter.",
        },
        {
          date: "2026-04-25",
          description:
            "Water turned back on for the season; supply connections and trap checked for leaks.",
        },
      ],
      routineCareItems: [
        {
          description: "Shut off the supply and drain the lines before the first hard freeze",
          frequencyMonths: 12,
          lastDoneDate: "2026-10-24",
        },
        {
          description: "Turn the water on in spring and check the connections for leaks",
          frequencyMonths: 12,
          lastDoneDate: "2026-04-25",
        },
      ],
      photos: {},
    },
    observations: [
      "A simple, sturdy stainless sink that has held up well outdoors. The basin has light surface marks and the faucet runs smoothly with no drips.",
      "The only real risk to it is a freeze. It was drained in October, so you are set for this winter.",
    ],
    briefingSystemType: "Outdoor Sink",
    briefingTiers: tiers(
      [
        900,
        1400,
        "Like-for-like: a stainless drop-in bar sink and faucet on the existing supply and drain.",
      ],
      [
        1600,
        2400,
        "A larger, heavier-gauge stainless sink with an outdoor-rated faucet and new supply lines and shutoffs.",
      ],
      [
        3200,
        4500,
        "A full outdoor sink station with a covered basin, hot water added and the stone cutout refinished to fit.",
      ],
    ),
  },

  // ── Hot Tub Patio and Home Gym ─────────────────────────────────────────
  {
    key: "hot-tub",
    groupId: "appliances",
    title: "Hot Tub",
    ageYears: 5,
    record: {
      systemName: "Hot Tub",
      category: "Appliance",
      isAppliance: true,
      status: "Healthy",
      make: "Sundance Spas",
      model: "Optima",
      serial: "SS-2021-39922",
      installDate: "2021-06",
      typicalLifespanYears: 18,
      conditionRating: "Excellent",
      specifications: [
        { label: "Seating", value: "6 to 7 adults" },
        { label: "Size", value: "About 7.5 ft square, roughly 400 gallons" },
        { label: "Water care", value: "UV-C sanitizing with two-stage filtration" },
        { label: "Electrical", value: "240V, 50A GFCI disconnect" },
        { label: "Cover", value: "Insulated cover with lifter" },
        { label: "Location", value: "Hot Tub Patio" },
      ],
      maintenanceLog: [
        {
          date: "2026-09-16",
          description:
            "Quarterly visit by Sundance Service: drained and refilled, filters cleaned, water balanced.",
          cost: 285,
        },
        {
          date: "2026-06-17",
          description:
            "Quarterly visit by Sundance Service: filters cleaned, water balanced, UV bulb replaced.",
          cost: 285,
        },
        {
          date: "2026-03-18",
          description: "Quarterly visit by Sundance Service: jets and cover seal inspected.",
          cost: 285,
        },
      ],
      routineCareItems: [
        {
          description: "Test and balance the water weekly",
        },
        {
          description: "Rinse the filters",
          frequencyMonths: 1,
          lastDoneDate: "2026-10-18",
        },
        {
          description: "Drain and refill at the quarterly Sundance Service visit",
          frequencyMonths: 3,
          lastDoneDate: "2026-09-16",
        },
      ],
      photos: {},
    },
    observations: [
      "Five years old and cared for on schedule, which is the whole game with a hot tub. The shell is unblemished, every jet runs, and the cover is still light, so it has not taken on water.",
      "Sundance Service is current on quarterly visits. This is one of the few services in your home that has never slipped.",
    ],
    briefingSystemType: "Hot Tub",
    briefingTiers: tiers(
      [
        9500,
        12500,
        "A mid-line six-person spa set on the existing patio and 50A disconnect, with the old tub hauled away.",
      ],
      [
        16000,
        20000,
        "Like-for-like: a current Sundance premium-series spa of the same size with a new cover and lifter, on the existing pad and disconnect.",
      ],
      [
        23000,
        29000,
        "Sundance's flagship series with app monitoring, upgraded jets and lighting, new steps and a powered cover lifter.",
      ],
    ),
  },
  {
    key: "infrared-sauna",
    groupId: "appliances",
    title: "Infrared Sauna",
    ageYears: 4,
    record: {
      systemName: "Infrared Sauna",
      category: "Appliance",
      isAppliance: true,
      status: "Healthy",
      make: "Clearlight",
      model: "Sanctuary 3",
      serial: "CL-2022-88134",
      installDate: "2022-04",
      typicalLifespanYears: 25,
      conditionRating: "Excellent",
      specifications: [
        { label: "Type", value: "Full-spectrum infrared, three-person" },
        { label: "Cabinet", value: "Cedar with a tempered glass door" },
        { label: "Size", value: "About 60 in. wide by 46 in. deep" },
        { label: "Power", value: "120V, dedicated 20A circuit" },
        { label: "Features", value: "Low-EMF heaters, chromotherapy lighting" },
        { label: "Location", value: "Home Gym, back wall" },
      ],
      maintenanceLog: [
        {
          date: "2026-03-08",
          description: "Benches and floor wiped down; heaters, door hinges and seal checked.",
        },
        {
          date: "2024-01-20",
          description: "Door hinge adjusted so the glass closes flush.",
        },
      ],
      routineCareItems: [
        {
          description: "Wipe the benches, backrests and floor with a damp cloth; no cleaners on the cedar",
          frequencyMonths: 1,
          lastDoneDate: "2026-10-22",
        },
        {
          description: "Check the heaters, door hinges and seal",
          frequencyMonths: 12,
          lastDoneDate: "2026-03-08",
        },
      ],
      photos: {},
    },
    observations: [
      "Four years into a long life. The cedar is clean and unstained, every heater panel comes up to temperature, and the glass door closes flush.",
      "Infrared saunas have very little to wear out. Keep towels on the benches and wipe it down after use, and the cedar will stay this color.",
    ],
    briefingSystemType: "Infrared Sauna",
    briefingTiers: tiers(
      [
        4500,
        6000,
        "A three-person far-infrared sauna assembled in the same spot on the existing circuit.",
      ],
      [
        8500,
        10500,
        "Like-for-like: a three-person full-spectrum Clearlight sauna, assembled on the back wall of the gym on the existing dedicated circuit.",
      ],
      [
        13000,
        17000,
        "A larger four to five person full-spectrum sauna, including the new 240V circuit it requires.",
      ],
    ),
  },
];
