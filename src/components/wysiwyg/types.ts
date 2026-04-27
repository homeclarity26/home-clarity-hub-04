// WYSIWYG Block Editor — Core Types

export type BlockType =
  | "cover"
  | "score"
  | "text"
  | "finding_card"
  | "finding_group"
  | "photo"
  | "photo_gallery"
  | "priority_action"
  | "cost_range"
  | "stat_card"
  | "divider"
  | "strategic_plan"
  | "chapter_header"
  | "ai_narrative"
  | "condition_rating"
  | "room_record"
  | "system_record"
  | "replacement_briefing"
  | "vision_project"
  | "recurring_services_register"
  | "condition_pill"
  | "concierge_action"
  | "maintenance_calendar";

// Word-only condition ratings — replaces the numeric Health Score system
// being deleted in Phase 6. Values are user-facing strings (rendered as-is)
// so changing them requires a data migration. New entries here must also be
// added to RATING_COLORS in ConditionRatingBlock.tsx.
export type ConditionRating = "Excellent" | "Good" | "Fair" | "Poor" | "Critical";

export type ColSpan = 1 | 2 | 3 | 4 | 6 | 12;

export interface ReportBlock {
  id: string;
  type: BlockType;
  content: Record<string, unknown>;
  colSpan: ColSpan;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Content shapes per block type ────────────────────────────────

export interface CoverContent {
  propertyName: string;
  address: string;
  reportTitle: string;
  date?: string;
  imageUrl?: string;
}

export interface ScoreContent {
  overall: number;
  exterior?: number;
  interior?: number;
  systems?: number;
  safety?: number;
}

export interface TextContent {
  html: string;
}

export interface FindingCardContent {
  name: string;
  rating: string; // Excellent | Good | Fair | Poor | Critical
  notes: string;
}

export interface FindingGroupContent {
  title: string;
  findings: FindingCardContent[];
}

export interface PhotoContent {
  url: string;
  caption?: string;
}

export interface PhotoGalleryContent {
  photos: PhotoContent[];
}

export interface PriorityActionContent {
  items: { text: string; priority: "urgent" | "high" | "medium" | "low" }[];
}

export interface CostRangeContent {
  label: string;
  low: number;
  high: number;
  tier?: string;
}

export interface StatCardContent {
  label: string;
  value: string;
  subtitle?: string;
  icon?: string;
}

export interface StrategicPlanContent {
  title: string;
  description: string;
  timeframe: string;
  urgency: "urgent" | "soon" | "future";
  estimatedCost?: string;
}

export interface ChapterHeaderContent {
  title: string;
  icon?: string;
  score?: number;
  chapterId?: string;
}

export interface AINarrativeContent {
  html: string;
  fieldNotes?: string;
  isGenerating?: boolean;
}

export interface ConditionRatingContent {
  // Optional eyebrow above the rating (e.g. "Overall Condition", "Wall Paint").
  // Leave blank when the surrounding context already names what's being rated.
  label?: string;
  rating: ConditionRating;
  // Optional one-line note rendered below the rating (e.g. "Recoat in 2-3 yrs").
  notes?: string;
}

// One row in the linked-vision-projects sidebar of a room. Lightweight by
// design — full vision detail lives in the linked vision_project block (B5).
export interface RoomLinkedVisionProject {
  id?: string;
  title: string;
  priority?: string;  // e.g. "Year 1-2", "Year 2-3"
}

// One row in the maintenance log (history of past service events on this
// system). Append-only — admins add entries from the field; clients read.
export interface SystemMaintenanceLogEntry {
  date: string;          // ISO date "YYYY-MM-DD"
  description: string;   // "Annual inspection — Verne & Ellsworth"
  cost?: number;         // optional cost in dollars
}

// One routine-care item — recurring task on this system (filter changes,
// inspections). Distinct from recurring_services rows because these are
// *system-attached* tasks (HVAC filter), not standalone vendor services.
export interface SystemRoutineCareItem {
  description: string;          // "Replace filter (MERV 11 20×25×4)"
  frequencyMonths?: number;     // 3 = quarterly
  lastDoneDate?: string;        // ISO date
}

// Photo-slot URLs by role per Master Spec 5.1.2 photo schema. The
// system_record block displays placeholder slots when a URL is unset so
// the admin sees what photos are still needed during a walkthrough.
export interface SystemPhotoSlots {
  unit?: string;             // overall unit shot
  serialPlate?: string;      // close-up of model/serial sticker
  installLocation?: string;  // wider context, clearance/access
  failureSignal?: string;    // optional — condensate stain, error code, etc.
}

export interface SystemRecordContent {
  // Identity
  systemName: string;             // "Furnace - Zone 1", "Sub-Zero Refrigerator"
  category?: string;              // "HVAC", "Plumbing", "Electrical", "Appliance"
  isAppliance?: boolean;          // true → eyebrow says "Appliance"; false → "System"
  imageUrl?: string;              // hero image
  status?: string;                // "Operational", "Approaching End-of-Life", etc.

  // Identification
  make?: string;
  model?: string;
  serial?: string;
  installDate?: string;           // ISO "YYYY-MM-DD" or just year "2009"
  installer?: string;
  warrantyStatus?: string;

  // Lifecycle math (current age and EOL year are derived in the renderer)
  typicalLifespanYears?: number;  // 20 for furnace, 12 for water heater, etc.
  expectedEolYear?: number;       // optional explicit override

  // Open-ended specs (Capacity, Efficiency, Fuel, Filter MERV, etc.).
  // Free-form to accommodate any system type without a schema migration
  // every time we add a new appliance class.
  specifications?: { label: string; value: string }[];

  // Condition + history
  conditionRating?: ConditionRating;
  maintenanceLog?: SystemMaintenanceLogEntry[];
  routineCareItems?: SystemRoutineCareItem[];

  // Photos by role — slots are always rendered; URLs fill them when present.
  photos?: SystemPhotoSlots;
}

// ── Replacement Briefing (B4) — the killer feature ──────────────────────
// Schema mirrors the replacement_briefings DB row created in M2 (Master
// Spec 5.1.2). The block stores the full payload in its content so the
// renderer is pure presentation — no runtime fetch.

export interface ReplacementBriefingTier {
  id: string;                     // 'essential' | 'enhanced' | 'signature'
  label: string;                  // 'Essential' | 'Enhanced' | 'Signature'
  priceLow?: number;              // dollars
  priceHigh?: number;             // dollars
  scopeHtml?: string;             // optional longer description
  inclusions?: string[];
  exclusions?: string[];
  warranty?: string;              // '5 years parts, 2 years labor'
  recommended?: boolean;          // true gets gold border + badge
}

export interface ReplacementBriefingPhoto {
  role: "unit" | "serial_plate" | "install_location" | "failure_signal";
  url: string;
  caption?: string;
}

export interface ReplacementBriefingCta {
  id: string;                     // 'emergency' | 'plan'
  label: string;                  // 'Help, this isn't working' / 'Plan my replacement'
  style: "rust" | "gold" | "navy"; // visual variant
  action: string;                 // 'open_concierge' for now (only handler post-C1)
  prompt?: string;                // text to prefill into Concierge
}

export interface ReplacementBriefingContent {
  systemType?: string;            // 'Furnace', 'AC Condenser', 'Water Heater'
  headline?: string;              // default 'Pre-scoped, pre-priced, ready when you are'
  intro?: string;                 // default explainer paragraph
  tiers: ReplacementBriefingTier[];
  photos?: ReplacementBriefingPhoto[];
  ctas?: ReplacementBriefingCta[];
  howReplacementHappensHtml?: string;
}

// ── Vision Project (B5) ─────────────────────────────────────────────────
// Full scope + design-fee education + 3-tier investment + REQUIRED AKR
// disclosure per [v1.13]. Reuses ReplacementBriefingTier shape since the
// 3-tier pattern is identical across briefings and vision projects.

export interface VisionProjectContent {
  // Identity
  projectTitle: string;
  category?: string;              // "Lifestyle", "Critical", "Comfort"
  priority?: string;              // "Year 1-2", "Year 4-5"
  imageUrl?: string;

  // Vision narrative (warm, aspirational)
  visionNarrativeHtml?: string;

  // Why design matters first — per [v1.18] / Master Spec Section 3
  designFeeEducationHtml?: string;
  designFeeLow?: number;          // dollars
  designFeeHigh?: number;

  // Scope of work (beautifully written, hedged)
  scopeOfWorkHtml?: string;

  // 3-tier investment (Essential / Enhanced [recommended] / Signature)
  tiers: ReplacementBriefingTier[];

  // Execution path — AKR transparently disclosed (REQUIRED per [v1.13]).
  // executionPathHtml defaults to the locked AKR-disclosure language.
  // akrDisclosed must be true; renderer shows a warning chip otherwise.
  executionPathHtml?: string;
  akrDisclosed: boolean;

  // Disruption forecast (e.g. "kitchen = 8 weeks of takeout")
  disruptionSummary?: string;

  // Sequencing dependencies (e.g. "electrical before chef's kitchen")
  dependenciesHtml?: string;

  // Optional bottom-of-block Concierge CTA
  conciergeActionLabel?: string;
  conciergeActionPrompt?: string;
}

// ── Recurring Services Register (B6) ────────────────────────────────────
// Mirrors recurring_services DB row from M3 + adds block-level config
// (concierge tier, view toggle, locked pitch text). The wizard seeds
// services from intake parsing (E4); this block renders + edits them.

export interface RecurringServiceRow {
  id?: string;                  // matches recurring_services.id when persisted
  category: string;             // M3 enum: lawn_landscaping, hvac, plumbing, etc.
  serviceName: string;
  vendorName?: string;
  vendorId?: string;
  frequency: string;            // M3 enum: weekly, biweekly, monthly, quarterly, biannual, annual, as_needed
  frequencyMonths?: number;
  costPerVisit?: number;
  annualCost?: number;
  monthlyCost?: number;         // pre-computed for renderer ergonomics
  lastServiceDate?: string;
  nextDueDate?: string;
  status?: "current" | "overdue" | "lapsed" | "paused";
  hbcManaged?: boolean;
  notesHtml?: string;
}

export type ConciergeTier = "none" | "tier_200" | "tier_400" | "tier_600";

export interface RecurringServicesRegisterContent {
  // Header
  title?: string;               // default "Recurring Services Register"

  // Services data — usually mirrors recurring_services rows for the property
  services: RecurringServiceRow[];

  // Auto-detected from properties.hbc_concierge_tier when block is seeded
  // by the wizard. Drives the "If HBC Managed" stat card monthly add-on
  // and the locked Concierge pitch dollar figure.
  conciergeTier?: ConciergeTier;

  // Time-spent estimate for the third stat card ([v2.39])
  estimatedHoursMonthly?: number;

  // View toggle persisted on block ([v2.36])
  showIfManagedColumn?: boolean;

  // Override for the Concierge pitch — defaults to locked HONEST framing
  // (saves time/frustration, NOT money) per [v2.38]
  conciergePitchHtml?: string;
}

// ── Maintenance Calendar (B8) ───────────────────────────────────────────
// 4-season grid (Spring/Summer/Fall/Winter) per [v1.20]. Stacks 2-up on
// mobile. Each item can optionally link to a recurring_services row so
// the renderer can deep-link from the calendar to the service detail.

export interface MaintenanceCalendarItem {
  description: string;
  recurringServiceId?: string;   // optional link to recurring_services.id
}

export interface MaintenanceCalendarContent {
  eyebrow?: string;              // default "The annual cadence"
  title?: string;                // default "Maintenance Calendar"
  spring: MaintenanceCalendarItem[];
  summer: MaintenanceCalendarItem[];
  fall: MaintenanceCalendarItem[];
  winter: MaintenanceCalendarItem[];
}

// ── Concierge Action (B11) ──────────────────────────────────────────────
// Tappable "do" prompt per [v1.24] — schedule / pay / log / retrieve.
// Tap opens ConciergePanel (built later in C1) with the prefilled prompt.
// Until C1 lands, the click handler is a no-op visual; the button still
// renders correctly so blocks containing it look right.

export interface ConciergeActionContent {
  label: string;                     // user-facing button text
  prompt: string;                    // text fed into ConciergePanel on tap
  // Visual variant — gold = primary action, rust = warning/emergency,
  // navy = quiet alternative
  style?: "gold" | "rust" | "navy";
  // Optional eyebrow ("Concierge Action", "Quick Schedule", etc.)
  eyebrow?: string;
}

// ── Condition Pill (B13) ────────────────────────────────────────────────
// Inline-pill variant of ConditionRatingBlock (B1). Same 5-color palette;
// used inline in narrative text or compact list views where the full card
// would be visually heavy. Just rating + tiny dot, no eyebrow no notes.

export interface ConditionPillContent {
  rating: ConditionRating;
}

// Evolving record per room. Every field except roomName is optional;
// blank string ("" or undefined) renders as muted "Not yet documented" in
// non-editable view. The renderer handles the three display states (filled
// / fillable in editable mode / muted-empty in viewer mode) per [v2.7] and
// the room-record evolving-fields pattern.
export interface RoomRecordContent {
  // Identity
  roomName: string;
  roomGroup?: string;          // e.g. "Bedrooms & Suites"
  floorLabel?: string;         // "Lower Level" / "Main Floor" / "Upper Floor"
  imageUrl?: string;

  // Construction
  dimensions?: string;         // "14 x 16"
  floorSqft?: number;
  ceiling?: string;            // "10ft" or "10ft tray"

  // Finishes (evolving fields)
  wallPaint?: string;
  trimPaint?: string;
  ceilingPaint?: string;
  flooring?: string;

  // Power, light, openings
  lightFixtures?: string;
  outlets?: string;
  switches?: string;
  windows?: string;
  doors?: string;

  // Condition + observations
  conditionRating?: ConditionRating;
  observationsHtml?: string;

  // Linked vision project chips (small references, not full vision content)
  linkedVisionProjects?: RoomLinkedVisionProject[];
}

// ─── Block templates for the "Add Block" picker ──────────────────

export interface BlockTemplate {
  type: BlockType;
  label: string;
  description: string;
  icon: string; // lucide icon name
  defaultColSpan: ColSpan;
  defaultContent: Record<string, unknown>;
}

export const BLOCK_TEMPLATES: BlockTemplate[] = [
  {
    type: "cover",
    label: "Cover",
    description: "Full-width hero with property name and address",
    icon: "Image",
    defaultColSpan: 12,
    defaultContent: { propertyName: "", address: "", reportTitle: "Home Clarity Report" },
  },
  {
    type: "chapter_header",
    label: "Chapter Header",
    description: "Section title with optional score badge",
    icon: "Heading1",
    defaultColSpan: 12,
    defaultContent: { title: "New Chapter", score: 0 },
  },
  {
    type: "score",
    label: "Health Score",
    description: "Overall and chapter health score circles",
    icon: "Activity",
    defaultColSpan: 12,
    defaultContent: { overall: 0 },
  },
  {
    type: "text",
    label: "Text / Narrative",
    description: "Rich text paragraph with inline editing",
    icon: "Type",
    defaultColSpan: 12,
    defaultContent: { html: "<p>Start writing...</p>" },
  },
  {
    type: "ai_narrative",
    label: "AI Narrative",
    description: "AI-assisted text block — paste notes, generate narrative",
    icon: "Sparkles",
    defaultColSpan: 12,
    defaultContent: { html: "", fieldNotes: "" },
  },
  {
    type: "finding_card",
    label: "Finding Card",
    description: "Single finding with condition rating",
    icon: "ClipboardCheck",
    defaultColSpan: 6,
    defaultContent: { name: "New Finding", rating: "Good", notes: "" },
  },
  {
    type: "finding_group",
    label: "Finding Group",
    description: "Group of related findings",
    icon: "LayoutList",
    defaultColSpan: 12,
    defaultContent: { title: "Findings", findings: [] },
  },
  {
    type: "photo",
    label: "Photo",
    description: "Single photo with caption",
    icon: "ImageIcon",
    defaultColSpan: 6,
    defaultContent: { url: "", caption: "" },
  },
  {
    type: "photo_gallery",
    label: "Photo Gallery",
    description: "Multi-photo grid layout",
    icon: "Images",
    defaultColSpan: 12,
    defaultContent: { photos: [] },
  },
  {
    type: "priority_action",
    label: "Priority Actions",
    description: "Urgent action items callout",
    icon: "AlertTriangle",
    defaultColSpan: 12,
    defaultContent: { items: [] },
  },
  {
    type: "cost_range",
    label: "Cost Range",
    description: "Estimated cost low-high range",
    icon: "DollarSign",
    defaultColSpan: 4,
    defaultContent: { label: "", low: 0, high: 0 },
  },
  {
    type: "stat_card",
    label: "Stat Card",
    description: "Single metric display card",
    icon: "BarChart3",
    defaultColSpan: 3,
    defaultContent: { label: "Metric", value: "0", subtitle: "" },
  },
  {
    type: "divider",
    label: "Divider",
    description: "Horizontal section separator",
    icon: "Minus",
    defaultColSpan: 12,
    defaultContent: {},
  },
  {
    type: "strategic_plan",
    label: "Strategic Plan",
    description: "Project recommendation card",
    icon: "Target",
    defaultColSpan: 6,
    defaultContent: { title: "", description: "", timeframe: "", urgency: "future" },
  },
  {
    type: "condition_rating",
    label: "Condition Rating",
    description: "Word-based condition (Excellent / Good / Fair / Poor / Critical)",
    icon: "Gauge",
    defaultColSpan: 4,
    defaultContent: { label: "Condition", rating: "Good", notes: "" },
  },
  {
    type: "room_record",
    label: "Room Record",
    description: "Full evolving record for a single room (paint, finishes, fixtures, condition, vision links)",
    icon: "DoorOpen",
    defaultColSpan: 12,
    defaultContent: {
      roomName: "New Room",
      conditionRating: "Good",
      linkedVisionProjects: [],
    },
  },
  {
    type: "system_record",
    label: "System Record",
    description: "System or appliance page with identification, lifecycle bar, photos, maintenance log",
    icon: "Settings2",
    defaultColSpan: 12,
    defaultContent: {
      systemName: "New System",
      isAppliance: false,
      conditionRating: "Good",
      specifications: [],
      maintenanceLog: [],
      routineCareItems: [],
      photos: {},
    },
  },
  {
    type: "replacement_briefing",
    label: "Replacement Briefing",
    description: "Pre-scoped, pre-priced replacement package with tiers, photos, and CTAs",
    icon: "Package",
    defaultColSpan: 12,
    defaultContent: {
      systemType: "System",
      headline: "Pre-scoped, pre-priced, ready when you are",
      intro: "When you are ready to replace this system, tap below. We send our trade partner a complete briefing so they arrive with everything they need. No site visit. No re-measuring. No surprise change orders.",
      tiers: [
        { id: "essential", label: "Essential", recommended: false },
        { id: "enhanced", label: "Enhanced", recommended: true },
        { id: "signature", label: "Signature", recommended: false },
      ],
      photos: [],
      ctas: [
        { id: "emergency", label: "Help, this isn't working", style: "rust", action: "open_concierge", prompt: "My {systemType} just stopped working. I need help today." },
        { id: "plan", label: "Plan my replacement", style: "gold", action: "open_concierge", prompt: "I want to start planning the replacement for my {systemType}." },
      ],
    },
  },
  {
    type: "vision_project",
    label: "Vision Project",
    description: "Full scoped vision page with narrative, design-fee education, 3 tiers, and AKR disclosure",
    icon: "Sparkles",
    defaultColSpan: 12,
    defaultContent: {
      projectTitle: "New Vision Project",
      tiers: [
        { id: "essential", label: "Essential", recommended: false },
        { id: "enhanced", label: "Enhanced", recommended: true },
        { id: "signature", label: "Signature", recommended: false },
      ],
      executionPathHtml: "When you are ready to start, this can be executed through <strong>AK Renovations</strong>, our in-house remodeling division. AK Renovations is openly owned by Adam and is a transparent partner in the HBC ecosystem. If you would prefer a different contractor, we will connect you with a vetted HBC trade partner. The choice is always yours. Either way, you stay in the same conversation with HBC.",
      akrDisclosed: true,
    },
  },
  {
    type: "recurring_services_register",
    label: "Recurring Services Register",
    description: "Full register of standing services with HBC concierge consolidation pitch",
    icon: "ListChecks",
    defaultColSpan: 12,
    defaultContent: {
      title: "Recurring Services Register",
      services: [],
      conciergeTier: "none",
      showIfManagedColumn: true,
      estimatedHoursMonthly: 0,
    },
  },
  {
    type: "condition_pill",
    label: "Condition Pill (inline)",
    description: "Tiny inline rating pill (use in narrative or compact lists)",
    icon: "Circle",
    defaultColSpan: 3,
    defaultContent: { rating: "Good" },
  },
  {
    type: "concierge_action",
    label: "Concierge Action",
    description: "Tappable do-prompt that opens the Concierge with prefilled text",
    icon: "MessageSquarePlus",
    defaultColSpan: 6,
    defaultContent: {
      eyebrow: "Concierge Action",
      label: "Schedule a service",
      prompt: "I want to schedule a service for my home.",
      style: "gold",
    },
  },
  {
    type: "maintenance_calendar",
    label: "Maintenance Calendar",
    description: "4-season grid of seasonal maintenance items (stacks 2-up on mobile)",
    icon: "CalendarDays",
    defaultColSpan: 12,
    defaultContent: {
      eyebrow: "The annual cadence",
      title: "Maintenance Calendar",
      spring: [],
      summer: [],
      fall: [],
      winter: [],
    },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────

export function createBlock(type: BlockType, order: number, overrides?: Partial<ReportBlock>): ReportBlock {
  const template = BLOCK_TEMPLATES.find((t) => t.type === type);
  return {
    id: crypto.randomUUID(),
    type,
    content: template?.defaultContent || {},
    colSpan: template?.defaultColSpan || 12,
    order,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
