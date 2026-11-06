// Caldwell demo: mechanical systems (Heating & Cooling, Water & Plumbing,
// Electrical & Power, Safety).
//
// Identity facts (make, model, serial, install date, lifespan, age, status)
// come straight from docs/demo/CALDWELL_DEMO_BIBLE.md. Furnace briefing
// tiers are locked there; all other tiers are installed-replacement ranges
// for Northeast Ohio at 2026 pricing. Photos are placed centrally, so
// `photos` stays empty and `imageUrl` is unset.

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

// Locked in the bible: both furnace zones carry the same three tiers.
const furnaceTiers = (): ReplacementBriefingTier[] =>
  tiers(
    [
      8500,
      11500,
      "Single-stage 96% condensing furnace on the existing venting and gas line, with a standard 10-year parts warranty.",
    ],
    [
      13500,
      17500,
      "Two-stage 97% furnace with a variable-speed blower and smart thermostat: quieter, with more even temperatures.",
    ],
    [
      22000,
      28000,
      "Modulating 99% furnace matching what you have today, plus MERV 13 whole-home filtration, room sensors, and a 12-year parts and labor warranty.",
    ],
  );

export const caldwellSystems: DemoSystem[] = [
  // ─── Heating & Cooling ─────────────────────────────────────────────────
  {
    key: "furnace-main-zone",
    groupId: "systems-hvac",
    title: "Furnace: Main Floor Zone",
    ageYears: 17,
    record: {
      systemName: "Furnace: Main Floor Zone",
      category: "HVAC",
      isAppliance: false,
      status: "Approaching End-of-Life",
      make: "Lennox",
      model: "SLP99V-090",
      serial: "5818H45821",
      installDate: "2009-08",
      typicalLifespanYears: 20,
      conditionRating: "Fair",
      specifications: [
        { label: "Heating", value: "90,000 BTU/h input, modulating gas valve, variable-speed ECM blower" },
        { label: "Efficiency", value: "Up to 99% AFUE, condensing" },
        { label: "Fuel", value: 'Natural gas, 3/4" black iron supply' },
        { label: "Location", value: "Lower-level mechanical room, full access from the garage" },
        { label: "Electrical", value: "120V dedicated circuit; 240V available on an adjacent circuit" },
        { label: "Venting and condensate", value: "PVC direct vent; condensate to a floor drain 8 ft away" },
        { label: "Ductwork", value: "Supply trunk 16 × 8, return 18 × 10, both serviceable" },
        { label: "Filter", value: "20 × 25 × 1 pleated, MERV 11" },
      ],
      maintenanceLog: [
        {
          date: "2026-04-30",
          description:
            "Spring tune-up missed. The service window passed with no visit scheduled.",
        },
        {
          date: "2025-10-14",
          description:
            "Fall tune-up by Airflow Mechanical: combustion analysis in spec, flame sensor cleaned, condensate trap flushed, heat exchanger inspected with no cracks found.",
          cost: 195,
        },
        {
          date: "2024-10-09",
          description:
            "Fall tune-up by Airflow Mechanical: burners cleaned, pressure switch tubing cleared, blower amp draw normal.",
          cost: 195,
        },
        {
          date: "2024-01-18",
          description: "No-heat service call: hot surface igniter replaced by Airflow Mechanical.",
          cost: 310,
        },
      ],
      routineCareItems: [
        {
          description: "Replace filter (20 × 25 × 1 pleated, MERV 11)",
          frequencyMonths: 3,
          lastDoneDate: "2026-04-10",
        },
        {
          description: "Professional tune-up and combustion check (Airflow Mechanical)",
          frequencyMonths: 6,
          lastDoneDate: "2025-10-14",
        },
        {
          description: "Flush the condensate trap and confirm the drain line runs clear",
          frequencyMonths: 12,
          lastDoneDate: "2025-10-14",
        },
        {
          description: "Keep the outdoor PVC intake and exhaust clear of snow and leaves",
        },
      ],
      photos: {},
    },
    observations: [
      "At 17 years into a typical 20-year life, this furnace is in its last few seasons. It still heats evenly and passed its combustion test in October 2025.",
      "The igniter was replaced in January 2024. That is a normal wear part, but repairs like it come more often from here.",
      "The spring 2026 tune-up was missed and the filter is past due. Both are quick catch-ups Bobby can schedule this month.",
      "We recommend replacing it on your schedule in Year 1-3, together with the upper zone, rather than on a cold night in January.",
    ],
    briefingSystemType: "Furnace",
    briefingTiers: furnaceTiers(),
  },
  {
    key: "furnace-upper-zone",
    groupId: "systems-hvac",
    title: "Furnace: Upper Floor Zone",
    ageYears: 17,
    record: {
      systemName: "Furnace: Upper Floor Zone",
      category: "HVAC",
      isAppliance: false,
      status: "Approaching End-of-Life",
      make: "Lennox",
      model: "SLP99V-090",
      serial: "5819A12387",
      installDate: "2009-08",
      typicalLifespanYears: 20,
      conditionRating: "Fair",
      specifications: [
        { label: "Heating input", value: "90,000 BTU/h, modulating gas valve" },
        { label: "Efficiency", value: "Up to 99% AFUE, condensing" },
        { label: "Fuel", value: 'Natural gas, 3/4" black iron supply' },
        { label: "Blower", value: "Variable-speed ECM" },
        { label: "Electrical", value: "120V dedicated circuit" },
        { label: "Location", value: "Conditioned attic mechanical closet, reached from the upper hallway" },
        { label: "Venting and condensate", value: "PVC direct vent; condensate to a drain with an overflow pan and safety switch" },
        { label: "Filter", value: "16 × 25 × 1 pleated, MERV 11" },
      ],
      maintenanceLog: [
        {
          date: "2026-04-30",
          description:
            "Spring tune-up missed. The service window passed with no visit scheduled.",
        },
        {
          date: "2025-10-14",
          description:
            "Fall tune-up by Airflow Mechanical: combustion analysis in spec, flame sensor cleaned, condensate trap flushed. Bearing noise noted at the inducer motor; monitor.",
          cost: 195,
        },
        {
          date: "2024-10-09",
          description:
            "Fall tune-up by Airflow Mechanical: burners cleaned, heat exchanger inspected with no cracks found.",
          cost: 195,
        },
        {
          date: "2023-12-06",
          description:
            "Service call for intermittent lockouts: pressure switch replaced by Airflow Mechanical.",
          cost: 265,
        },
      ],
      routineCareItems: [
        {
          description: "Replace filter (16 × 25 × 1 pleated, MERV 11)",
          frequencyMonths: 3,
          lastDoneDate: "2026-04-10",
        },
        {
          description: "Professional tune-up and combustion check (Airflow Mechanical)",
          frequencyMonths: 6,
          lastDoneDate: "2025-10-14",
        },
        {
          description: "Flush the condensate trap and confirm the drain line runs clear",
          frequencyMonths: 12,
          lastDoneDate: "2025-10-14",
        },
      ],
      photos: {},
    },
    observations: [
      "This is the same model and the same age as the main floor unit, 17 years into a typical 20-year life. It sits in the conditioned attic mechanical closet off your upper hallway.",
      "The technician noted bearing noise at the inducer motor in October 2025. It is not urgent, but it is the part we would expect to fail first.",
      "The spring 2026 tune-up was missed here too, and the filter is overdue.",
      "Because it sits above finished ceilings, the overflow pan and safety switch under it matter; both were dry and working at our visit. Replacing both zones in one project means one crew, one permit and matched equipment on both floors.",
    ],
    briefingSystemType: "Furnace",
    briefingTiers: furnaceTiers(),
  },
  {
    key: "ac-main-zone",
    groupId: "systems-hvac",
    title: "AC Condenser: Main Zone",
    ageYears: 12,
    record: {
      systemName: "AC Condenser: Main Zone",
      category: "HVAC",
      isAppliance: false,
      status: "Mid-Life",
      make: "Lennox",
      model: "XC21-036",
      serial: "1421H88012",
      installDate: "2014-05",
      typicalLifespanYears: 18,
      conditionRating: "Good",
      specifications: [
        { label: "Cooling capacity", value: "3 tons (36,000 BTU/h)" },
        { label: "Compressor", value: "Two-stage scroll" },
        { label: "Efficiency", value: "Up to 21 SEER with matched indoor coil" },
        { label: "Refrigerant", value: "R-410A" },
        { label: "Electrical", value: "240V single phase, dedicated circuit with outdoor disconnect" },
        { label: "Line set", value: '3/8" liquid, 7/8" suction' },
        { label: "Indoor match", value: "Lennox cased coil on the main floor furnace" },
      ],
      maintenanceLog: [
        {
          date: "2025-04-22",
          description:
            "Spring tune-up by Airflow Mechanical: outdoor coil washed, refrigerant pressures and superheat in spec, capacitor tested.",
          cost: 195,
        },
        {
          date: "2024-04-17",
          description:
            "Spring tune-up by Airflow Mechanical: coil washed, contactor inspected, condensate drain cleared.",
          cost: 195,
        },
        {
          date: "2023-07-11",
          description: "No-cool service call: dual run capacitor replaced by Airflow Mechanical.",
          cost: 240,
        },
      ],
      routineCareItems: [
        {
          description: "Spring tune-up and coil wash (Airflow Mechanical)",
          frequencyMonths: 12,
          lastDoneDate: "2025-04-22",
        },
        {
          description: "Rinse the outdoor coil with a garden hose and keep 24 inches clear around the cabinet",
          frequencyMonths: 6,
        },
        {
          description: "Check the condensate drain at the indoor coil for clogs",
          frequencyMonths: 12,
          lastDoneDate: "2025-04-22",
        },
      ],
      photos: {},
    },
    observations: [
      "At 12 of a typical 18 years, this condenser is mid-life and cooling well. Pressures and temperatures were in spec at its last tune-up in April 2025.",
      "The spring 2026 tune-up was missed, so it ran all of last summer without a coil wash. The next one should not slip.",
      "It runs on R-410A refrigerant, which is still available for service. New equipment uses a different refrigerant, so when this unit is replaced the indoor coil goes with it.",
      "When the furnaces are replaced, your HVAC partner will decide whether to carry this condenser forward or swap it in the same visit; doing both at once shares labor.",
    ],
    briefingSystemType: "AC Condenser",
    briefingTiers: tiers(
      [
        6500,
        9000,
        "Single-stage condenser with a matched indoor coil, reusing the existing pad, disconnect and electrical.",
      ],
      [
        9500,
        13500,
        "Two-stage condenser with matched coil and a new line set: the closest match to the comfort and quiet you have today.",
      ],
      [
        15000,
        20000,
        "Inverter-driven variable-capacity condenser with matched coil, new line set and humidity control through a communicating thermostat.",
      ],
    ),
  },
  {
    key: "ac-upper-zone",
    groupId: "systems-hvac",
    title: "AC Condenser: Upper Zone",
    ageYears: 12,
    record: {
      systemName: "AC Condenser: Upper Zone",
      category: "HVAC",
      isAppliance: false,
      status: "Mid-Life",
      make: "Lennox",
      model: "XC21-024",
      serial: "1421H88016",
      installDate: "2014-05",
      typicalLifespanYears: 18,
      conditionRating: "Good",
      specifications: [
        { label: "Cooling capacity", value: "2 tons (24,000 BTU/h)" },
        { label: "Compressor", value: "Two-stage scroll" },
        { label: "Efficiency", value: "Up to 21 SEER with matched indoor coil" },
        { label: "Refrigerant", value: "R-410A" },
        { label: "Electrical", value: "240V single phase, dedicated circuit with outdoor disconnect" },
        { label: "Line set", value: '3/8" liquid, 3/4" suction' },
        { label: "Indoor match", value: "Lennox cased coil on the upper floor furnace" },
      ],
      maintenanceLog: [
        {
          date: "2025-04-22",
          description:
            "Spring tune-up by Airflow Mechanical: outdoor coil washed, refrigerant pressures and superheat in spec, fan motor amp draw normal.",
          cost: 195,
        },
        {
          date: "2024-06-25",
          description: "Service call for a unit that would not start: contactor replaced by Airflow Mechanical.",
          cost: 210,
        },
        {
          date: "2024-04-17",
          description:
            "Spring tune-up by Airflow Mechanical: coil washed, capacitor tested, condensate drain cleared.",
          cost: 195,
        },
      ],
      routineCareItems: [
        {
          description: "Spring tune-up and coil wash (Airflow Mechanical)",
          frequencyMonths: 12,
          lastDoneDate: "2025-04-22",
        },
        {
          description: "Rinse the outdoor coil with a garden hose and keep 24 inches clear around the cabinet",
          frequencyMonths: 6,
        },
        {
          description: "Check the condensate drain at the indoor coil for clogs",
          frequencyMonths: 12,
          lastDoneDate: "2025-04-22",
        },
      ],
      photos: {},
    },
    observations: [
      "This 2-ton unit cools the upper floor and is mid-life at 12 of a typical 18 years.",
      "It is the harder-working of your two condensers in July, since the bedrooms carry the heat of the day. It kept up without complaint at our visit.",
      "The spring 2026 tune-up was missed. Getting both condensers washed and checked next spring is the single best thing you can do for their remaining years.",
    ],
    briefingSystemType: "AC Condenser",
    briefingTiers: tiers(
      [
        6000,
        8500,
        "Single-stage condenser with a matched indoor coil, reusing the existing pad, disconnect and electrical.",
      ],
      [
        9000,
        12500,
        "Two-stage condenser with matched coil and a new line set: the closest match to the comfort and quiet you have today.",
      ],
      [
        14000,
        18500,
        "Inverter-driven variable-capacity condenser with matched coil, new line set and humidity control through a communicating thermostat.",
      ],
    ),
  },

  // ─── Water & Plumbing ──────────────────────────────────────────────────
  {
    key: "tankless-water-heater",
    groupId: "systems-mechanical",
    title: "Tankless Water Heater",
    ageYears: 6,
    record: {
      systemName: "Tankless Water Heater",
      category: "Water",
      isAppliance: false,
      status: "Healthy",
      make: "Rinnai",
      model: "RUR199iN",
      serial: "RUR2024031",
      installDate: "2020-04",
      typicalLifespanYears: 22,
      conditionRating: "Excellent",
      specifications: [
        { label: "Maximum input", value: "199,000 BTU/h, modulating down to 15,000" },
        { label: "Type", value: "Condensing tankless, indoor, wall-mounted" },
        { label: "Flow rate", value: "Up to 11 GPM" },
        { label: "Fuel", value: 'Natural gas, 3/4" supply' },
        { label: "Recirculation", value: "Built-in pump with thermal bypass valve at the farthest fixture" },
        { label: "Venting", value: "PVC direct vent through the sidewall" },
        { label: "Electrical", value: "120V, standard receptacle" },
        { label: "Service valves", value: "Isolation valve kit installed for descaling" },
      ],
      maintenanceLog: [
        {
          date: "2026-04-21",
          description:
            "Annual descaling flush, inlet screen cleaned, condensate neutralizer media replaced, combustion checked.",
          cost: 215,
        },
        {
          date: "2025-04-15",
          description:
            "Annual descaling flush and inlet screen cleaning; recirculation schedule set for mornings and evenings.",
          cost: 185,
        },
        {
          date: "2024-04-09",
          description: "Annual descaling flush; condensate neutralizer media replaced.",
          cost: 210,
        },
      ],
      routineCareItems: [
        {
          description: "Descaling flush through the isolation valves",
          frequencyMonths: 12,
          lastDoneDate: "2026-04-21",
        },
        {
          description: "Clean the cold water inlet screen",
          frequencyMonths: 12,
          lastDoneDate: "2026-04-21",
        },
        {
          description: "Replace condensate neutralizer media",
          frequencyMonths: 24,
          lastDoneDate: "2026-04-21",
        },
      ],
      photos: {},
    },
    observations: [
      "This is a top-of-the-line condensing tankless, six years into a typical 22-year life, and it has been flushed every spring since it went in.",
      "At 199,000 BTU it can run two showers and the dishwasher together without a temperature drop, and the built-in recirculation pump gets hot water upstairs quickly.",
      "Your softener protects it. Scale is what shortens the life of a tankless heater, and softened water keeps the heat exchanger clean between flushes.",
    ],
    briefingSystemType: "Tankless Water Heater",
    briefingTiers: tiers(
      [
        4200,
        5500,
        "Condensing tankless without recirculation, connected to the existing gas, venting and isolation valves.",
      ],
      [
        5800,
        7400,
        "Like-for-like 199,000 BTU condensing tankless with built-in recirculation, new isolation valves and a new condensate neutralizer.",
      ],
      [
        8000,
        10500,
        "Premium condensing tankless with a dedicated recirculation return line, Wi-Fi monitoring and an automatic leak shutoff valve.",
      ],
    ),
  },
  {
    key: "water-softener",
    groupId: "systems-mechanical",
    title: "Whole-House Water Softener",
    ageYears: 8,
    record: {
      systemName: "Whole-House Water Softener",
      category: "Water",
      isAppliance: false,
      status: "Healthy",
      make: "Kinetico",
      model: "Premier S650",
      serial: "K2018-44219",
      installDate: "2018-06",
      typicalLifespanYears: 15,
      conditionRating: "Good",
      specifications: [
        { label: "Configuration", value: "Twin tank, alternating, soft water during regeneration" },
        { label: "Control", value: "Non-electric, water-powered, demand metered" },
        { label: "Regeneration", value: "Countercurrent, triggered by gallons used" },
        { label: "Power", value: "None required" },
        { label: "Hardness setting", value: "10 grains per gallon" },
        { label: "Salt", value: "Pellet or block; brine drum holds about 200 lb" },
        { label: "Plumbing", value: '1" bypass valve, discharge to the mechanical room floor drain' },
      ],
      maintenanceLog: [
        {
          date: "2026-03-12",
          description:
            "Annual dealer service: softened water tested at 0 grains, brine drum cleaned, prefilter replaced.",
          cost: 145,
        },
        {
          date: "2025-03-18",
          description: "Annual dealer service: hardness test, valve cycle check, prefilter replaced.",
          cost: 140,
        },
        {
          date: "2024-03-14",
          description: "Annual dealer service: hardness test and prefilter replaced.",
          cost: 135,
        },
      ],
      routineCareItems: [
        {
          description: "Check the salt level and top off the brine drum",
          frequencyMonths: 1,
        },
        {
          description: "Dealer service: hardness test, prefilter and valve check",
          frequencyMonths: 12,
          lastDoneDate: "2026-03-12",
        },
        {
          description: "Clean out the brine drum",
          frequencyMonths: 12,
          lastDoneDate: "2026-03-12",
        },
      ],
      photos: {},
    },
    observations: [
      "Your softener is eight years into a typical 15-year life and doing its job: water tested fully soft at the March 2026 service.",
      "It runs on water pressure rather than electricity, so it keeps working through a power outage and regenerates only when you have actually used the water.",
      "The only thing it asks of you is salt. A quick look in the brine drum once a month is enough.",
    ],
    briefingSystemType: "Water Softener",
    briefingTiers: tiers(
      [
        1800,
        2600,
        "Single-tank metered electric softener sized for the home, connected to the existing bypass and drain.",
      ],
      [
        3800,
        5200,
        "Like-for-like twin-tank, non-electric softener with a new bypass valve and prefilter.",
      ],
      [
        6500,
        8500,
        "Twin-tank softener plus whole-house carbon filtration and a reverse osmosis drinking water tap at the kitchen sink.",
      ],
    ),
  },
  {
    key: "sump-pump-primary",
    groupId: "systems-mechanical",
    title: "Sump Pump: Primary",
    ageYears: 7,
    record: {
      systemName: "Sump Pump: Primary",
      category: "Water",
      isAppliance: false,
      status: "Healthy",
      make: "Zoeller",
      model: "M53",
      serial: "Z2019-7821",
      installDate: "2019-03",
      typicalLifespanYears: 12,
      conditionRating: "Good",
      specifications: [
        { label: "Motor", value: "1/3 HP class, 115V, 9.7 amps" },
        { label: "Flow rate", value: "43 GPM at 5 ft of lift; 34 GPM at 10 ft" },
        { label: "Maximum head", value: "About 19 ft" },
        { label: "Switch", value: "Integral vertical float, automatic" },
        { label: "Construction", value: "Cast iron, submersible" },
        { label: "Discharge", value: '1-1/2" PVC with check valve' },
        { label: "Electrical", value: "Dedicated 120V receptacle" },
      ],
      maintenanceLog: [
        {
          date: "2025-12-08",
          description:
            "Test: float lifted by hand, pump started and cleared the basin, check valve held.",
        },
        {
          date: "2025-06-03",
          description: "Test: pump cycled normally; debris cleaned from the basin floor.",
        },
        {
          date: "2023-04-19",
          description: "Check valve replaced after it began hammering at shutoff.",
          cost: 165,
        },
      ],
      routineCareItems: [
        {
          description: "Test by lifting the float or filling the basin until the pump runs",
          frequencyMonths: 6,
          lastDoneDate: "2025-12-08",
        },
        {
          description: "Clear debris from the basin and confirm the float moves freely",
          frequencyMonths: 12,
          lastDoneDate: "2025-06-03",
        },
        {
          description: "Confirm the discharge line outside is clear and not frozen",
          frequencyMonths: 12,
        },
      ],
      photos: {},
    },
    observations: [
      "The M53 is the cast-iron workhorse most plumbers install in their own homes, and yours is seven years into a typical 12-year life.",
      "It was last tested in December 2025, so the twice-a-year test is overdue. It takes five minutes: lift the float, watch it run, confirm the water leaves.",
      "Your finished lower level depends on this pump. With the battery backup beside it and the generator behind both, you have three layers of protection.",
    ],
    briefingSystemType: "Sump Pump",
    briefingTiers: tiers(
      [
        650,
        950,
        "Like-for-like 1/3 HP cast-iron pump on the existing discharge with a new check valve.",
      ],
      [
        1100,
        1600,
        "Upgraded 1/2 HP cast-iron pump with a new check valve, a union for easy service and a high-water alarm.",
      ],
      [
        2200,
        3200,
        "1/2 HP pump with a new sealed basin lid, a Wi-Fi high-water alarm and a rebuilt, freeze-resistant discharge line.",
      ],
    ),
  },
  {
    key: "sump-pump-backup",
    groupId: "systems-mechanical",
    title: "Sump Pump: Battery Backup",
    ageYears: 4,
    record: {
      systemName: "Sump Pump: Battery Backup",
      category: "Water",
      isAppliance: false,
      status: "Healthy",
      make: "Zoeller",
      model: "Aquanot 508",
      serial: "Z2022-4419",
      installDate: "2022-10",
      typicalLifespanYears: 8,
      conditionRating: "Good",
      specifications: [
        { label: "Pump", value: "12V DC submersible backup pump" },
        { label: "Battery", value: "12V AGM deep cycle, maintenance-free, installed 2022" },
        { label: "Charger", value: "Automatic float charger with audible alarm, 120V" },
        { label: "Activation", value: "Independent float set above the primary pump switch" },
        { label: "Discharge", value: '1-1/2" PVC with its own check valve, tied into the primary line' },
        { label: "Run time", value: "Several hours of continuous pumping on a full charge" },
      ],
      maintenanceLog: [
        {
          date: "2025-12-08",
          description:
            "Test: primary pump unplugged, backup started on its own float and cleared the basin on battery.",
        },
        {
          date: "2025-06-03",
          description: "Test: backup cycled on battery; charger showing full charge, terminals clean.",
        },
        {
          date: "2024-06-11",
          description: "Test: backup cycled on battery; alarm sounded and reset as designed.",
        },
      ],
      routineCareItems: [
        {
          description: "Test on battery with the primary pump unplugged",
          frequencyMonths: 6,
          lastDoneDate: "2025-12-08",
        },
        {
          description: "Check the charger status light and battery terminals",
          frequencyMonths: 3,
        },
        {
          description: "Replace the backup battery",
          frequencyMonths: 60,
          lastDoneDate: "2022-10-18",
        },
      ],
      photos: {},
    },
    observations: [
      "This pump takes over if the primary fails or the power goes out, and it ran correctly on battery at its last test in December 2025.",
      "The battery is the original from 2022. Backup batteries typically last four to five years, so plan to replace it in 2027 before it lets you down.",
      "Like the primary, its twice-a-year test is overdue. Test both on the same day.",
    ],
    briefingSystemType: "Battery Backup Sump Pump",
    briefingTiers: tiers(
      [
        900,
        1300,
        "Like-for-like 12V backup pump with a new AGM battery and charger on the existing discharge.",
      ],
      [
        1600,
        2300,
        "Higher-capacity DC backup pump with a new AGM battery and a smart charger that sends Wi-Fi alerts to your phone.",
      ],
      [
        2800,
        3900,
        "High-capacity backup pump with dual batteries for extended run time, Wi-Fi monitoring and a new sealed basin lid.",
      ],
    ),
  },

  // ─── Electrical & Power ────────────────────────────────────────────────
  {
    key: "electrical-panel",
    groupId: "systems-additional",
    title: "Main Electrical Panel",
    ageYears: 28,
    record: {
      systemName: "Main Electrical Panel",
      category: "Electrical",
      isAppliance: false,
      status: "Healthy",
      make: "Square D",
      model: "QO140M200",
      serial: "SQ-1998-200A",
      installDate: "1998-09",
      typicalLifespanYears: 40,
      conditionRating: "Good",
      specifications: [
        { label: "Service", value: "200A, 120/240V single phase" },
        { label: "Main breaker", value: "200A" },
        { label: "Spaces", value: "40 total, 38 in use" },
        { label: "Breakers", value: "Square D QO plug-on" },
        { label: "Bus", value: "Tin-plated copper" },
        { label: "Standby power", value: "200A service-rated automatic transfer switch (Generac)" },
        { label: "Surge protection", value: "None installed" },
      ],
      maintenanceLog: [
        {
          date: "2025-07-22",
          description:
            "Transfer switch exercised under load during the generator service; panel transferred and returned to utility power cleanly.",
        },
        {
          date: "2024-04-16",
          description:
            "Electrician inspection: lugs torqued, infrared scan clean with no hot spots, circuit directory updated.",
          cost: 225,
        },
      ],
      routineCareItems: [
        {
          description: "Press the test button on each GFCI breaker and receptacle",
          frequencyMonths: 6,
        },
        {
          description: "Infrared scan and lug torque check by a licensed electrician",
          frequencyMonths: 36,
          lastDoneDate: "2024-04-16",
        },
        {
          description: "Keep 36 inches of clear working space in front of the panel",
        },
      ],
      photos: {},
    },
    observations: [
      "Your panel is the original 1998 Square D QO, the line electricians consider the best residential panel made. At 28 years it is clean inside, with no corrosion, no heat discoloration and no doubled-up wires.",
      "It is nearly full: 38 of 40 spaces are in use. The four-season porch will need a circuit for its mini-split, so we would plan a small subpanel as part of that project.",
      "There is no whole-home surge protector. With this much Sub-Zero and Wolf electronics in the house, adding one is inexpensive insurance.",
      "The bedroom circuits predate arc-fault protection, which was not required in 1998. Adding it at the breaker is an easy upgrade the next time an electrician is here.",
    ],
    briefingSystemType: "Electrical Panel",
    briefingTiers: tiers(
      [
        3200,
        4500,
        "Like-for-like 200A, 40-space panel replacement with new breakers, permit and inspection.",
      ],
      [
        5500,
        7500,
        "New 200A panel with added circuit capacity, whole-home surge protection and arc-fault and ground-fault breakers to current code.",
      ],
      [
        11000,
        15000,
        "Service upgrade to 320A with a smart panel for circuit-level monitoring, an EV-ready circuit and the transfer switch reconfigured to match.",
      ],
    ),
  },
  {
    key: "whole-home-generator",
    groupId: "systems-additional",
    title: "Whole-Home Generator",
    ageYears: 5,
    record: {
      systemName: "Whole-Home Generator",
      category: "Electrical",
      isAppliance: false,
      status: "Healthy",
      make: "Generac",
      model: "Guardian 22kW",
      serial: "G2021-87332",
      installDate: "2021-07",
      typicalLifespanYears: 25,
      conditionRating: "Excellent",
      specifications: [
        { label: "Rated output", value: "22 kW on propane; 19.5 kW on natural gas, as installed" },
        { label: "Fuel", value: "Natural gas" },
        { label: "Engine", value: "Generac G-Force 999cc V-twin, air-cooled" },
        { label: "Voltage", value: "120/240V single phase" },
        { label: "Transfer switch", value: "200A service-rated automatic, with load shedding on the AC condensers" },
        { label: "Monitoring", value: "Mobile Link Wi-Fi" },
        { label: "Self-test", value: "Weekly, 5 minutes" },
        { label: "Starting battery", value: "12V Group 26R, replaced July 2024" },
      ],
      maintenanceLog: [
        {
          date: "2026-07-14",
          description:
            "Annual service by PowerGuard Standby: oil and filter, air filter, spark plugs, valve clearance checked, transfer test under load.",
          cost: 420,
        },
        {
          date: "2025-07-22",
          description:
            "Annual service by PowerGuard Standby: oil and filter, air filter, transfer switch exercised under load.",
          cost: 420,
        },
        {
          date: "2024-07-16",
          description:
            "Annual service by PowerGuard Standby: oil and filter, air filter, starting battery replaced.",
          cost: 560,
        },
        {
          date: "2023-07-18",
          description: "Annual service by PowerGuard Standby: oil and filter, air filter, spark plugs.",
          cost: 420,
        },
      ],
      routineCareItems: [
        {
          description: "Annual service: oil, filters, plugs and transfer test (PowerGuard Standby)",
          frequencyMonths: 12,
          lastDoneDate: "2026-07-14",
        },
        {
          description: "Replace the starting battery",
          frequencyMonths: 36,
          lastDoneDate: "2024-07-16",
        },
        {
          description: "Keep snow, leaves and mulch clear of the enclosure on all sides",
        },
        {
          description: "Check the oil level after any outage longer than 24 hours",
        },
      ],
      photos: {},
    },
    observations: [
      "Your generator is five years into a typical 25-year life, has been serviced every July since it was installed, and starts itself for a five-minute test every week.",
      "It runs on your natural gas line, so there is no tank to fill, and it picks up the whole house within seconds of an outage.",
      "On natural gas it produces 19.5 kW. That carries the house comfortably; the transfer switch staggers the two AC condensers so they never start at the same moment.",
      "It also keeps both sump pumps powered, which is the real reason to own one in a home with a finished lower level.",
    ],
    briefingSystemType: "Generator",
    briefingTiers: tiers(
      [
        9500,
        12500,
        "Like-for-like air-cooled standby generator on the existing pad, gas line and transfer switch.",
      ],
      [
        13500,
        17500,
        "New 26 kW air-cooled generator with a new 200A automatic transfer switch, load management modules and an extended warranty.",
      ],
      [
        24000,
        32000,
        "Liquid-cooled standby generator, quieter and built for long outages, with a new pad, upsized gas line and new transfer switch.",
      ],
    ),
  },

  // ─── Safety ────────────────────────────────────────────────────────────
  {
    key: "radon-mitigation",
    groupId: "safety-detection",
    title: "Radon Mitigation System",
    ageYears: 8,
    record: {
      systemName: "Radon Mitigation System",
      category: "Safety",
      isAppliance: false,
      status: "Healthy",
      make: "RadonAway",
      model: "RP265",
      serial: "RA2018-3318",
      installDate: "2018-11",
      typicalLifespanYears: 20,
      conditionRating: "Excellent",
      specifications: [
        { label: "System type", value: "Active sub-slab depressurization" },
        { label: "Fan", value: "RadonAway RP265 inline, runs continuously" },
        { label: "Power", value: "120V, roughly 85 to 140 watts" },
        { label: "Maximum suction", value: "About 2.3 inches of water column" },
        { label: "Piping", value: '4" Schedule 40 PVC, exterior riser discharging above the eave' },
        { label: "Gauge", value: "U-tube manometer in the mechanical room, reading 1.4 inches" },
        { label: "Latest test", value: "1.2 pCi/L in January 2025 (EPA action level is 4.0)" },
      ],
      maintenanceLog: [
        {
          date: "2025-01-20",
          description: "48-hour continuous radon test in the lower level: 1.2 pCi/L.",
          cost: 150,
        },
        {
          date: "2024-05-07",
          description: "Slab penetrations and sump lid seal inspected; manometer reading steady at 1.4 inches.",
        },
        {
          date: "2023-01-17",
          description: "48-hour continuous radon test in the lower level: 1.0 pCi/L.",
          cost: 150,
        },
      ],
      routineCareItems: [
        {
          description: "Glance at the manometer: the two fluid levels should be uneven",
          frequencyMonths: 1,
        },
        {
          description: "Retest radon levels in the lower level",
          frequencyMonths: 24,
          lastDoneDate: "2025-01-20",
        },
        {
          description: "Listen for new noise or vibration at the outdoor fan",
          frequencyMonths: 6,
        },
      ],
      photos: {},
    },
    observations: [
      "Your radon system has run continuously since 2018 and is doing exactly what it should: the January 2025 test came back at 1.2 pCi/L, well under the EPA action level of 4.0.",
      "This matters more in your home than most, because the lower level is real living space with a guest suite, a gym and a rec room.",
      "The gauge in the mechanical room is your early warning. If the two fluid levels ever sit even, the fan has stopped; tell Bobby and we will have it looked at.",
      "The next retest is due in January 2027.",
    ],
    briefingSystemType: "Radon Fan",
    briefingTiers: tiers(
      [
        450,
        700,
        "Like-for-like fan replacement on the existing piping, with new couplings.",
      ],
      [
        850,
        1300,
        "New fan with new couplings, a new manometer, a fan-failure alarm and a follow-up radon test.",
      ],
      [
        1800,
        2800,
        "New fan with a continuous digital radon monitor and app alerts, slab and sump lid seals renewed, and a certified follow-up test.",
      ],
    ),
  },
];
