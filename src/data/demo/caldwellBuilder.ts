// Builds the public Caldwell demo report (/demo) from authored source data.
//
// Pure function, no React, no network. Input is the authored Caldwell data
// (types in caldwellTypes.ts); output is exactly what the real ReportTab and
// the real page templates consume: `groups`, `pages` (each page's
// `narrative` is a ReportBlock[]), `pageImages`, plus per-page photo
// captions. Group ids, titles and page order come from
// docs/demo/CALDWELL_DEMO_BIBLE.md.

import type { ReportPageData } from "@/data/reportContent";
import type { PortalGroup } from "@/hooks/useClientPortal";
import type {
  BlockType,
  ColSpan,
  ReportBlock,
  ReplacementBriefingContent,
  ReplacementBriefingPhoto,
  ReplacementBriefingTier,
  RoomLinkedVisionProject,
  RoomRecordContent,
  SystemRecordContent,
  VisionProjectContent,
} from "@/components/wysiwyg/types";
import type {
  DemoGroupId,
  DemoHome,
  DemoInfoPage,
  DemoPhoto,
  DemoRoom,
  DemoStrategy,
  DemoSystem,
  DemoVision,
} from "./caldwellTypes";

// ─── Public shapes ───────────────────────────────────────────────────────

export interface CaldwellDemoInput {
  home: DemoHome;
  /** Page key → photos. First photo is the page hero; the rest the gallery. */
  photos: Record<string, DemoPhoto[]>;
  interiorRooms: DemoRoom[];
  exteriorRooms: DemoRoom[];
  systems: DemoSystem[];
  appliances: DemoSystem[];
  infoPages: DemoInfoPage[];
  visionProjects: DemoVision[];
  strategy: DemoStrategy;
}

/**
 * A built page. Same object the live portal hands ReportTab: the base
 * ReportPageData fields, `narrative` as typed blocks, plus the optional
 * extras the System and Strategy templates read off the page object.
 */
export type DemoReportPage = Omit<ReportPageData, "narrative"> & {
  narrative: ReportBlock[];
  // SystemTemplatePage extras
  expected_lifespan_years?: number;
  current_age_years?: number;
  key_observations?: string[];
  hide_lifecycle_alert?: boolean;
  // StrategyTemplatePage extras
  strategyEyebrow?: string;
  displayTitle?: string;
  intro?: string;
  // Information pages keep their authored source for the designed view
  info?: DemoInfoPage;
};

export interface CaldwellDemo {
  home: DemoHome;
  groups: PortalGroup[];
  pages: Record<string, DemoReportPage>;
  /** Page key → image srcs (hero first). Only pages that have photos. */
  pageImages: Record<string, string[]>;
  /** Page key → (image src → caption). */
  photoCaptions: Record<string, Record<string, string>>;
  /** Data problems found while building. Empty when the data is clean. */
  warnings: string[];
}

// ─── Bible: groups, titles, page order ───────────────────────────────────

export const DEMO_GROUPS: { id: DemoGroupId; title: string; pages: string[] }[] = [
  {
    id: "information",
    title: "Information",
    pages: [
      "welcome-letter",
      "executive-summary",
      "home-at-a-glance",
      "vision-inventory",
      "top-priorities",
      "how-to-use",
    ],
  },
  {
    id: "interior-living",
    title: "Living Spaces",
    pages: ["foyer", "formal-living-room", "dining-room", "family-room", "office-study"],
  },
  {
    id: "interior-utility",
    title: "Kitchen & Service Spaces",
    pages: ["kitchen", "walk-in-pantry", "breakfast-nook", "mudroom", "laundry-room"],
  },
  {
    id: "interior-bedrooms",
    title: "Bedrooms & Suites",
    pages: [
      "primary-bedroom",
      "primary-closet",
      "bedroom-olivia",
      "bedroom-jack",
      "bedroom-guest",
      "upper-hallway",
      "bonus-room",
    ],
  },
  {
    id: "interior-bathrooms",
    title: "Bathrooms",
    pages: [
      "primary-bathroom",
      "jack-and-jill-bathroom",
      "hall-bathroom",
      "powder-room",
      "guest-suite-bathroom",
    ],
  },
  {
    id: "interior-additional",
    title: "Lower Level",
    pages: ["rec-room", "home-gym-sauna", "wet-bar", "guest-suite-bedroom"],
  },
  {
    id: "interior-unfinished",
    title: "Garage & Mechanical",
    pages: ["three-car-garage", "mechanical-room"],
  },
  {
    id: "exterior",
    title: "Exterior Envelope",
    pages: ["roof", "siding-trim", "windows-doors", "driveway-walkways", "landscape-grounds"],
  },
  {
    id: "exterior-structures",
    title: "Outdoor Living",
    pages: ["front-porch", "rear-deck", "screened-porch", "outdoor-kitchen", "hot-tub-patio"],
  },
  {
    id: "systems-hvac",
    title: "Heating & Cooling",
    pages: ["furnace-main-zone", "furnace-upper-zone", "ac-main-zone", "ac-upper-zone"],
  },
  {
    id: "systems-mechanical",
    title: "Water & Plumbing",
    pages: ["tankless-water-heater", "water-softener", "sump-pump-primary", "sump-pump-backup"],
  },
  {
    id: "systems-additional",
    title: "Electrical & Power",
    pages: ["electrical-panel", "whole-home-generator"],
  },
  { id: "safety-detection", title: "Safety", pages: ["radon-mitigation"] },
  {
    id: "appliances",
    title: "Appliances",
    pages: [
      "refrigerator",
      "range",
      "wall-oven",
      "dishwasher",
      "microwave-drawer",
      "range-hood",
      "wine-fridge",
      "kitchen-ice-maker",
      "washer",
      "dryer",
      "beverage-center",
      "bar-ice-maker",
      "built-in-grill",
      "outdoor-refrigerator",
      "outdoor-sink",
      "hot-tub",
      "infrared-sauna",
    ],
  },
  {
    id: "strategy",
    title: "Strategy",
    pages: [
      "strategy-roadmap",
      "vision-primary-bath",
      "vision-hvac-replacement",
      "vision-kitchen-refresh",
      "vision-screened-porch",
      "vision-driveway",
      "vision-roof-replacement",
      "recurring-services",
      "maintenance-calendar",
    ],
  },
];

const GROUP_BY_ID = new Map(DEMO_GROUPS.map((g) => [g.id as string, g]));
const BIBLE_GROUP_FOR_PAGE = new Map<string, DemoGroupId>(
  DEMO_GROUPS.flatMap((g) => g.pages.map((p) => [p, g.id] as [string, DemoGroupId])),
);

export const STRATEGY_PAGE_KEYS = {
  roadmap: "strategy-roadmap",
  services: "recurring-services",
  calendar: "maintenance-calendar",
} as const;

// ─── Small helpers ───────────────────────────────────────────────────────

const BUILT_AT = "2026-11-01T00:00:00.000Z";

function block(
  pageKey: string,
  type: BlockType,
  order: number,
  content: object,
  colSpan: ColSpan = 12,
): ReportBlock {
  return {
    id: `demo-${pageKey}-${type}-${order}`,
    type,
    content: { ...content } as Record<string, unknown>,
    colSpan,
    order,
    createdAt: BUILT_AT,
    updatedAt: BUILT_AT,
  };
}

const money = (n: number) => "$" + n.toLocaleString("en-US");

/** "$14,000 - $18,000": hyphen with spaces, never a dash character. */
export function formatRange(low?: number, high?: number): string {
  if (low != null && high != null) return `${money(low)} - ${money(high)}`;
  if (low != null) return `from ${money(low)}`;
  if (high != null) return `up to ${money(high)}`;
  return "";
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2009-08" → "August 2009"; "2009-08-14" → "August 2009"; "2009" → "2009". */
export function formatInstallDate(value?: string): string {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(value.trim());
  if (!m) return value;
  const month = MONTHS[parseInt(m[2], 10) - 1];
  return month ? `${month} ${m[1]}` : m[1];
}

const stripHtml = (html?: string) => (html ?? "").replace(/<[^>]+>/g, "").trim();

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Client copy never carries an em-dash or en-dash. The authored data is
 * written without them; this is the last line of defense so one stray
 * character can never reach the page. Em-dash becomes a comma, en-dash a
 * hyphen.
 */
function scrubString(s: string): string {
  return s
    .replace(/\s*(?:—|&mdash;|&#8212;)\s*/g, ", ")
    .replace(/–|&ndash;|&#8211;/g, "-");
}

function scrubDeep<T>(value: T): T {
  if (typeof value === "string") return scrubString(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => scrubDeep(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[scrubString(k)] = scrubDeep(v);
    }
    return out as T;
  }
  return value;
}

// ─── Page builders ───────────────────────────────────────────────────────

const EXTERIOR_GROUPS: ReadonlySet<string> = new Set(["exterior", "exterior-structures"]);

function buildRoomPage(
  room: DemoRoom,
  groupId: DemoGroupId,
  visions: DemoVision[],
): DemoReportPage {
  const r = room.record;
  const groupTitle = GROUP_BY_ID.get(groupId)?.title ?? "";

  // Resolve "Linked Vision Project" chips to real vision page keys so the
  // link can navigate. Match on id first, then on title.
  const linked: RoomLinkedVisionProject[] = (r.linkedVisionProjects ?? []).map((vp) => {
    const byId = vp.id ? visions.find((v) => v.key === vp.id) : undefined;
    const want = norm(vp.title);
    const byTitle =
      byId ??
      visions.find((v) => norm(v.title) === want || norm(v.project.projectTitle) === want) ??
      visions.find((v) => want.length > 0 && (norm(v.title).includes(want) || want.includes(norm(v.title))));
    if (byTitle) {
      return { ...vp, id: byTitle.key, priority: vp.priority ?? byTitle.project.priority };
    }
    // No matching vision page: keep the chip, drop the dead link target.
    const unlinked: RoomLinkedVisionProject = { title: vp.title, priority: vp.priority };
    return unlinked;
  });

  const content: RoomRecordContent = {
    ...r,
    roomName: r.roomName || room.title,
    roomGroup: r.roomGroup ?? groupTitle,
    linkedVisionProjects: linked,
    omitEmptyFinishes: EXTERIOR_GROUPS.has(groupId) ? true : r.omitEmptyFinishes,
    conciergeAction: room.conciergeAction
      ? {
          title: room.conciergeAction.title,
          body: room.conciergeAction.body,
          prompt: room.conciergeAction.prompt,
        }
      : r.conciergeAction,
  };

  // Metadata strip under the title: plain values, in this order.
  const specs: { label: string; value: string }[] = [];
  if (r.dimensions) specs.push({ label: "Dimensions", value: r.dimensions });
  if (r.floorSqft != null) {
    specs.push({ label: "Floor Area", value: `${r.floorSqft.toLocaleString("en-US")} sqft` });
  }
  if (r.ceiling) specs.push({ label: "Ceiling", value: r.ceiling });
  if (r.floorLabel) specs.push({ label: "Level", value: r.floorLabel });

  return {
    id: room.key,
    title: room.title,
    group: groupId,
    conditionRating: r.conditionRating,
    narrative: [block(room.key, "room_record", 0, content)],
    specs,
  };
}

const END_OF_LIFE_STATUS = /end.of.life|replace|past|failing|overdue/i;

function buildSystemPage(
  sys: DemoSystem,
  groupId: DemoGroupId,
  photos: DemoPhoto[],
): DemoReportPage {
  const r = sys.record;
  const lifespan = r.typicalLifespanYears;
  const hasBriefing = !!sys.briefingTiers && sys.briefingTiers.length > 0;
  const isAppliance = groupId === "appliances" || !!r.isAppliance;

  // The System template derives its end-of-life pill and alert from
  // age / lifespan (70% and up). A system assessed healthy with no
  // Replacement Briefing must not show an alert that points at one.
  const lateLife = !!lifespan && lifespan > 0 && sys.ageYears / lifespan >= 0.7;
  const hideAlert = lateLife && !hasBriefing && !END_OF_LIFE_STATUS.test(r.status ?? "");
  const pillShows = !isAppliance && lateLife && !hideAlert;

  const specs: { label: string; value: string }[] = [];
  if (r.make) specs.push({ label: "Make", value: r.make });
  if (r.model) specs.push({ label: "Model", value: r.model });
  if (r.serial) specs.push({ label: "Serial Number", value: r.serial });
  if (r.installDate) specs.push({ label: "Installed", value: formatInstallDate(r.installDate) });
  if (lifespan) specs.push({ label: "Typical Lifespan", value: `${lifespan} years` });
  specs.push({
    label: "Current Age",
    value: `${sys.ageYears} ${sys.ageYears === 1 ? "year" : "years"}`,
  });
  // The pill already says it when it shows; otherwise list the status.
  if (r.status && !pillShows) specs.push({ label: "Status", value: r.status });
  if (r.installer) specs.push({ label: "Installer", value: r.installer });
  if (r.warrantyStatus) specs.push({ label: "Warranty", value: r.warrantyStatus });

  const record: SystemRecordContent = {
    ...r,
    systemName: r.systemName || sys.title,
    isAppliance,
  };

  const blocks: ReportBlock[] = [block(sys.key, "system_record", 0, record)];

  if (hasBriefing) {
    const systemType = sys.briefingSystemType ?? sys.title;
    const lower = systemType.toLowerCase();
    const partner = groupId === "systems-hvac" ? "our HVAC partner" : "our trade partner";
    const briefingPhotos: ReplacementBriefingPhoto[] = photos.map((p, i) => ({
      role:
        i === 0
          ? "unit"
          : /serial|plate/i.test(`${p.caption ?? ""} ${p.src}`)
            ? "serial_plate"
            : "install_location",
      url: p.src,
      caption: p.caption,
    }));
    const briefing: ReplacementBriefingContent = {
      systemType,
      headline: "Pre-scoped, pre-priced, ready when you are",
      intro: `When you're ready to replace this ${lower}, tap below. We'll send ${partner} a complete briefing: your model, capacity, install location photos and every connection detail on this page. They arrive with everything they need to install. No site visit. No re-measuring. No surprise change orders.`,
      tiers: sys.briefingTiers as ReplacementBriefingTier[],
      photos: briefingPhotos,
      ctas: [
        {
          id: "emergency",
          label: "Help, this isn't working",
          style: "rust",
          action: "open_concierge",
          prompt: `My ${lower} just stopped working. I need help today.`,
        },
        {
          id: "plan",
          label: "Plan my replacement",
          style: "gold",
          action: "open_concierge",
          prompt: `I want to start planning the replacement for my ${lower}.`,
        },
      ],
    };
    blocks.push(block(sys.key, "replacement_briefing", 1, briefing));
  }

  return {
    id: sys.key,
    title: sys.title,
    group: groupId,
    conditionRating: r.conditionRating,
    narrative: blocks,
    specs,
    expected_lifespan_years: lifespan,
    current_age_years: sys.ageYears,
    key_observations: sys.observations.filter((o) => o.trim().length > 0),
    ...(hideAlert ? { hide_lifecycle_alert: true } : {}),
  };
}

const TRADE_LED_PLANNING_HTML =
  "This project is trade-led, so it starts with a short planning visit instead of a design phase. We walk the work with the trade partner, confirm measurements and materials, and lock the schedule before anything is ordered.";

function buildVisionPage(v: DemoVision): DemoReportPage {
  const p = v.project;
  const hasDesignPhase =
    !!p.designFeeEducationHtml || p.designFeeLow != null || p.designFeeHigh != null;

  const content: VisionProjectContent = {
    ...p,
    projectTitle: p.projectTitle || v.title,
    // The viewer always draws the design callout; never leave it empty.
    designFeeEducationHtml: hasDesignPhase ? p.designFeeEducationHtml : TRADE_LED_PLANNING_HTML,
    conciergeActionLabel: p.conciergeActionLabel ?? "Ready to talk this project through?",
    conciergeActionPrompt:
      p.conciergeActionPrompt ?? `Tell Adam I want to start planning: ${p.projectTitle || v.title}.`,
    conciergeActionButtonLabel:
      p.conciergeActionButtonLabel ?? (hasDesignPhase ? "Start design" : "Start planning"),
  };

  const tier = (id: string) => {
    const t = p.tiers.find((x) => x.id === id);
    return {
      price: formatRange(t?.priceLow, t?.priceHigh),
      description: stripHtml(t?.scopeHtml),
    };
  };

  return {
    id: v.key,
    title: v.title,
    group: "strategy",
    narrative: [block(v.key, "vision_project", 0, content)],
    timing: p.priority,
    tiers: {
      essential: tier("essential"),
      enhanced: tier("enhanced"),
      signature: tier("signature"),
    },
  };
}

function buildStrategyPages(strategy: DemoStrategy): DemoReportPage[] {
  const total = strategy.services.reduce((s, x) => s + (x.monthlyCost ?? 0), 0);
  const overdue = strategy.services.filter((s) => s.status === "overdue").length;

  const roadmap: DemoReportPage = {
    id: STRATEGY_PAGE_KEYS.roadmap,
    title: "Strategy & Roadmap",
    group: "strategy",
    narrative: [block(STRATEGY_PAGE_KEYS.roadmap, "capital_plan", 0, strategy.capitalPlan)],
    strategyEyebrow: "Strategy",
    displayTitle: "Your 10-Year Plan",
    intro:
      "Defense first, then offense, then expansion. Each bar is a project window, not a deadline. Ranges are shown by phase; we never roll them into one grand total, because you choose the pace.",
  };

  const services: DemoReportPage = {
    id: STRATEGY_PAGE_KEYS.services,
    title: "Recurring Services",
    group: "strategy",
    narrative: [
      block(STRATEGY_PAGE_KEYS.services, "recurring_services_register", 0, {
        services: strategy.services,
        conciergeTier: strategy.conciergeTier,
      }),
    ],
    strategyEyebrow: "Strategy · Recurring Services",
    displayTitle: "Everything you're paying for, in one place",
    intro: `We captured every recurring service the home consumes: what you have, who provides it, how often, and what's overdue. That is ${strategy.services.length} services at ${money(total)} per month, with ${overdue} overdue today. Most homeowners are juggling 8 to 12 vendors and lose track. There's a better way.`,
  };

  const calendar: DemoReportPage = {
    id: STRATEGY_PAGE_KEYS.calendar,
    title: "Maintenance Calendar",
    group: "strategy",
    narrative: [
      block(STRATEGY_PAGE_KEYS.calendar, "maintenance_calendar", 0, strategy.maintenanceCalendar),
    ],
    strategyEyebrow: "Strategy · Maintenance Calendar",
    displayTitle: "The rhythm of a well-kept home",
    intro:
      "Four seasons, one short list each. These are the tasks that keep small things small. Anything tied to a recurring service is already on the register.",
  };

  return [roadmap, services, calendar];
}

/**
 * Information pages render through DemoInfoPageView (a designed layout),
 * which reads `page.info`. The page still carries real blocks so it is a
 * well-formed report page for anything that walks `narrative`.
 */
function buildInfoPage(info: DemoInfoPage): DemoReportPage {
  const blocks: ReportBlock[] = [];
  let order = 0;
  const push = (type: BlockType, content: object, colSpan: ColSpan = 12) =>
    blocks.push(block(info.key, type, order++, content, colSpan));
  const para = (s: string) => `<p>${escapeHtml(s)}</p>`;

  if (info.lede) push("text", { html: para(info.lede) });
  for (const stat of info.stats ?? []) {
    push("stat_card", { label: stat.label, value: stat.value, subtitle: stat.subtitle }, 3);
  }
  for (const section of info.sections ?? []) {
    const html =
      (section.heading ? `<h3>${escapeHtml(section.heading)}</h3>` : "") +
      (section.paragraphs ?? []).map(para).join("") +
      (section.bullets && section.bullets.length > 0
        ? `<ul>${section.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
        : "");
    if (html) push("text", { html });
  }
  if (info.numbered && info.numbered.length > 0) {
    push("text", {
      html: `<ol>${info.numbered
        .map(
          (n) =>
            `<li><strong>${escapeHtml(n.title)}</strong>${n.tag ? ` (${escapeHtml(n.tag)})` : ""}: ${escapeHtml(n.body)}</li>`,
        )
        .join("")}</ol>`,
    });
  }
  if (info.callout) {
    push("text", {
      html: `<p><strong>${escapeHtml(info.callout.label)}</strong></p>${para(info.callout.body)}`,
    });
  }
  if (info.signature) push("text", { html: `<p><em>${escapeHtml(info.signature)}</em></p>` });
  if (blocks.length === 0) push("text", { html: para(info.title) });

  return {
    id: info.key,
    title: info.title,
    group: "information",
    narrative: blocks,
    info,
  };
}

// ─── Builder ─────────────────────────────────────────────────────────────

export function buildCaldwellDemo(rawInput: CaldwellDemoInput): CaldwellDemo {
  const input = scrubDeep(rawInput);
  const warnings: string[] = [];
  const pages: Record<string, DemoReportPage> = {};
  /** group id → page keys in authored order */
  const members = new Map<string, string[]>();

  const place = (page: DemoReportPage, wantedGroup: string | undefined, fallback: DemoGroupId) => {
    if (pages[page.id]) {
      warnings.push(`Duplicate page key "${page.id}" ignored.`);
      return;
    }
    let groupId = wantedGroup;
    if (!groupId || !GROUP_BY_ID.has(groupId)) {
      groupId = BIBLE_GROUP_FOR_PAGE.get(page.id) ?? fallback;
      warnings.push(`Page "${page.id}" had unknown group "${wantedGroup ?? ""}"; placed in "${groupId}".`);
    }
    if (!BIBLE_GROUP_FOR_PAGE.has(page.id)) {
      warnings.push(`Page "${page.id}" is not a page key in the demo bible.`);
    }
    pages[page.id] = { ...page, group: groupId };
    members.set(groupId, [...(members.get(groupId) ?? []), page.id]);
  };

  const groupOf = (wanted: string | undefined, key: string, fallback: DemoGroupId): DemoGroupId =>
    (wanted && GROUP_BY_ID.has(wanted)
      ? wanted
      : BIBLE_GROUP_FOR_PAGE.get(key) ?? fallback) as DemoGroupId;

  for (const info of input.infoPages) place(buildInfoPage(info), "information", "information");

  for (const room of input.interiorRooms) {
    const g = groupOf(room.groupId, room.key, "interior-additional");
    place(buildRoomPage(room, g, input.visionProjects), room.groupId, "interior-additional");
  }
  for (const room of input.exteriorRooms) {
    const g = groupOf(room.groupId, room.key, "exterior-structures");
    place(buildRoomPage(room, g, input.visionProjects), room.groupId, "exterior-structures");
  }
  for (const sys of input.systems) {
    const g = groupOf(sys.groupId, sys.key, "systems-additional");
    place(buildSystemPage(sys, g, input.photos[sys.key] ?? []), sys.groupId, "systems-additional");
  }
  for (const app of input.appliances) {
    const g = groupOf(app.groupId, app.key, "appliances");
    place(buildSystemPage(app, g, input.photos[app.key] ?? []), app.groupId, "appliances");
  }
  for (const v of input.visionProjects) {
    if (!v.key.startsWith("vision-")) {
      warnings.push(`Vision page key "${v.key}" must start with "vision-".`);
    }
    place(buildVisionPage(v), "strategy", "strategy");
  }
  for (const p of buildStrategyPages(input.strategy)) place(p, "strategy", "strategy");

  // Groups in bible order; pages in bible order, then any extras as authored.
  const groups: PortalGroup[] = [];
  for (const g of DEMO_GROUPS) {
    const present = members.get(g.id) ?? [];
    if (present.length === 0) continue;
    const ordered = [
      ...g.pages.filter((k) => present.includes(k)),
      ...present.filter((k) => !g.pages.includes(k)),
    ];
    groups.push({ id: g.id, title: g.title, pages: ordered });
  }

  // Photos: only for pages that exist, hero first.
  const pageImages: Record<string, string[]> = {};
  const photoCaptions: Record<string, Record<string, string>> = {};
  for (const [key, list] of Object.entries(input.photos)) {
    if (!pages[key]) continue;
    const usable = list.filter((p) => !!p.src);
    if (usable.length === 0) continue;
    pageImages[key] = usable.map((p) => p.src);
    const captions: Record<string, string> = {};
    for (const p of usable) if (p.caption) captions[p.src] = p.caption;
    photoCaptions[key] = captions;
  }

  return { home: input.home, groups, pages, pageImages, photoCaptions, warnings };
}
