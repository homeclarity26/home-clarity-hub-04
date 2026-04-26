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
  | "room_record";

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
