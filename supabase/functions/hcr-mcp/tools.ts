// hcr-mcp tool registry + handlers.
//
// Every tool validates its arguments through the zod schemas in
// _shared/reportPageSchemas.ts and maps content through the pure builders
// in _shared/reportPageMapping.ts, so the MCP bridge and the wizard's
// Step 5 publish produce identical report_pages rows and blocks. The
// schema is the guardrail: prose length caps, no em-dashes, no partial
// tier pricing, and a literal "PUBLISH" confirmation gate.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/** Service-role client factory. index.ts creates the client through this
 * wrapper so handler signatures and the runtime client share one type. */
export function createServiceRoleClient(url: string, serviceRoleKey: string) {
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

type SupabaseClient = ReturnType<typeof createServiceRoleClient>;
import type { z } from "zod";
import {
  getPageArgsSchema,
  getReportArgsSchema,
  listPropertiesArgsSchema,
  publishReportArgsSchema,
  runPublishQaArgsSchema,
  setCapitalPlanArgsSchema,
  setMaintenanceCalendarArgsSchema,
  setRecurringServicesArgsSchema,
  upsertGenericPageArgsSchema,
  upsertRoomPageArgsSchema,
  upsertSystemPageArgsSchema,
  upsertVisionPageArgsSchema,
} from "../_shared/reportPageSchemas.ts";
import {
  auditReportPageRows,
  buildCapitalPlanBlock,
  buildGenericPageBlocks,
  buildMaintenanceCalendarBlock,
  buildRecurringServicesBlock,
  buildRoomPagePayload,
  buildSystemPagePayload,
  buildVisionPagePayload,
  makeBlock,
  replaceBlockOfType,
  type ReportBlock,
  type ReportPageRowLike,
  type StructuredPageColumns,
  summarizePageFields,
} from "../_shared/reportPageMapping.ts";

// ─── Tool result envelope ─────────────────────────────────────────────────

export class McpToolError extends Error {}

export interface ToolOutcome {
  /** JSON-serializable result surfaced to the MCP client. */
  result: unknown;
  /** One-line summary persisted to mcp_activity.result_summary. */
  summary: string;
}

type ToolHandler = (db: SupabaseClient, args: unknown) => Promise<ToolOutcome>;

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: ToolHandler;
}

function parseArgs<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, args: unknown): T {
  const parsed = schema.safeParse(args ?? {});
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new McpToolError(`Invalid arguments: ${details}`);
  }
  return parsed.data;
}

// ─── DB row shapes (columns verified against generated types) ─────────────

interface PropertyRow {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  property_name: string | null;
  client_user_id: string;
}

interface ReportRow {
  id: string;
  property_id: string;
  title: string;
  status: string;
  updated_at: string;
}

interface PageRow extends ReportPageRowLike {
  sort_order: number;
  status: string;
}

const PAGE_QA_COLUMNS =
  "page_key, title, group_name, status, sort_order, narrative, condition_rating, specs, key_observations, tiers";

async function requireReport(db: SupabaseClient, reportId: string) {
  const { data, error } = await db
    .from("reports")
    .select("id, property_id, title, status")
    .eq("id", reportId)
    .maybeSingle();
  if (error) throw new McpToolError(`reports lookup failed: ${error.message}`);
  if (!data) throw new McpToolError(`No report found with id ${reportId}`);
  return data as { id: string; property_id: string; title: string; status: string };
}

async function fetchQaRows(db: SupabaseClient, reportId: string): Promise<PageRow[]> {
  const { data, error } = await db
    .from("report_pages")
    .select(PAGE_QA_COLUMNS)
    .eq("report_id", reportId)
    .order("sort_order", { ascending: true });
  if (error) throw new McpToolError(`report_pages lookup failed: ${error.message}`);
  return (data ?? []) as PageRow[];
}

// ─── Upsert core (mirrors Step5Publish row construction) ──────────────────

// Section labels → sort_order bands, matching the wizard's
// sectionIndex * 100 + pageIndex scheme (Step2TOC CANONICAL_SECTIONS order).
const GROUP_BANDS: Array<[RegExp, number]> = [
  [/information/i, 0],
  [/space|interior|exterior/i, 1],
  [/system|appliance|safety/i, 2],
  [/strategy/i, 3],
];

function groupBand(group: string): number {
  for (const [re, band] of GROUP_BANDS) {
    if (re.test(group)) return band;
  }
  return 4;
}

interface UpsertPageInput {
  report_id: string;
  page_key: string;
  title: string;
  group: string;
  blocks: ReportBlock[];
  columns: StructuredPageColumns;
  now: string;
}

async function upsertReportPage(db: SupabaseClient, input: UpsertPageInput) {
  await requireReport(db, input.report_id);

  const { data: existing, error: exErr } = await db
    .from("report_pages")
    .select("id, sort_order, status")
    .eq("report_id", input.report_id)
    .eq("page_key", input.page_key)
    .maybeSingle();
  if (exErr) throw new McpToolError(`report_pages lookup failed: ${exErr.message}`);

  let sortOrder = (existing as { sort_order: number } | null)?.sort_order;
  if (sortOrder === undefined || sortOrder === null) {
    const { count, error: cntErr } = await db
      .from("report_pages")
      .select("id", { count: "exact", head: true })
      .eq("report_id", input.report_id)
      .eq("group_name", input.group);
    if (cntErr) throw new McpToolError(`sort_order derivation failed: ${cntErr.message}`);
    sortOrder = groupBand(input.group) * 100 + (count ?? 0);
  }

  const status = (existing as { status: string } | null)?.status ?? "draft";
  const { columns } = input;
  const row: Record<string, unknown> = {
    report_id: input.report_id,
    page_key: input.page_key,
    title: input.title,
    group_name: input.group,
    narrative: input.blocks,
    condition_rating: columns.condition_rating,
    specs: columns.specs,
    key_observations: columns.key_observations,
    status,
    sort_order: sortOrder,
    updated_at: input.now,
  };
  // Optional structured columns are only written when populated so a
  // re-author never wipes data filled by other flows (photo routing etc.).
  if (columns.tiers) row.tiers = columns.tiers;
  if (columns.current_age_years !== null) {
    row.current_age_years = columns.current_age_years;
  }
  if (columns.expected_lifespan_years !== null) {
    row.expected_lifespan_years = columns.expected_lifespan_years;
  }
  if (columns.maintenance) row.maintenance = columns.maintenance;
  if (columns.images) row.images = columns.images;

  const { error: upErr } = await db
    .from("report_pages")
    .upsert(row, { onConflict: "report_id,page_key" });
  if (upErr) throw new McpToolError(`report_pages upsert failed: ${upErr.message}`);

  return { created: !existing, sort_order: sortOrder, status };
}

// ─── Strategy-page upsert (block replacement on standing pages) ───────────

interface StrategyPageSpec {
  page_key: string;
  title: string;
}

async function setStrategyBlock(
  db: SupabaseClient,
  reportId: string,
  spec: StrategyPageSpec,
  block: ReportBlock,
  now: string,
): Promise<{ created: boolean }> {
  await requireReport(db, reportId);
  const { data: existing, error: exErr } = await db
    .from("report_pages")
    .select("id, title, narrative, sort_order, status")
    .eq("report_id", reportId)
    .eq("page_key", spec.page_key)
    .maybeSingle();
  if (exErr) throw new McpToolError(`report_pages lookup failed: ${exErr.message}`);

  const existingRow = existing as
    | { title: string; narrative: unknown; sort_order: number; status: string }
    | null;
  const existingBlocks: ReportBlock[] = Array.isArray(existingRow?.narrative)
    ? (existingRow?.narrative as ReportBlock[])
    : [];
  const blocks = replaceBlockOfType(existingBlocks, block);

  let sortOrder = existingRow?.sort_order;
  if (sortOrder === undefined || sortOrder === null) {
    const { count } = await db
      .from("report_pages")
      .select("id", { count: "exact", head: true })
      .eq("report_id", reportId)
      .eq("group_name", "Strategy");
    sortOrder = 300 + (count ?? 0);
  }

  const { error: upErr } = await db.from("report_pages").upsert(
    {
      report_id: reportId,
      page_key: spec.page_key,
      title: existingRow?.title ?? spec.title,
      group_name: "Strategy",
      narrative: blocks,
      status: existingRow?.status ?? "draft",
      sort_order: sortOrder,
      updated_at: now,
    },
    { onConflict: "report_id,page_key" },
  );
  if (upErr) throw new McpToolError(`report_pages upsert failed: ${upErr.message}`);
  return { created: !existingRow };
}

// ─── JSON Schema fragments (tools/list) ───────────────────────────────────

const REPORT_ID_PROP = {
  type: "string",
  format: "uuid",
  description: "Report id (from list_properties or get_report).",
};

const PAGE_KEY_PROP = {
  type: "string",
  pattern: "^[a-z0-9][a-z0-9-]{1,79}$",
  description: "Lowercase kebab-case page key, e.g. primary-suite or hvac-furnace.",
};

const CONDITION_PROP = {
  type: "string",
  enum: ["Excellent", "Good", "Fair", "Poor", "Critical"],
  description: "Word-based condition rating. Never invent one; omit if unknown.",
};

const SPEC_ITEMS_PROP = {
  type: "array",
  maxItems: 16,
  description: "Label/value spec rows (e.g. Capacity / 80,000 BTU).",
  items: {
    type: "object",
    properties: {
      label: { type: "string", maxLength: 160 },
      value: { type: "string", maxLength: 160 },
    },
    required: ["label", "value"],
  },
};

const OBSERVATIONS_PROP = {
  type: "array",
  maxItems: 12,
  description:
    "Walkthrough observations, one short sentence or two per entry (max 400 chars each). No em-dashes.",
  items: { type: "string", maxLength: 400 },
};

const TIER_PROP = {
  type: "object",
  description:
    "One investment tier. Real prices only; never invent pricing. Omit the whole tier set if any tier is unpriced.",
  properties: {
    priceLow: { type: "number", exclusiveMinimum: 0 },
    priceHigh: { type: "number", exclusiveMinimum: 0 },
    description: { type: "string", maxLength: 600 },
    recommended: { type: "boolean" },
  },
  required: ["priceLow", "priceHigh", "description"],
};

const TIER_SET_PROP = {
  type: "object",
  description:
    "Essential / Enhanced / Signature triple. All three tiers required and fully priced, or omit entirely.",
  properties: {
    essential: TIER_PROP,
    enhanced: TIER_PROP,
    signature: TIER_PROP,
  },
  required: ["essential", "enhanced", "signature"],
};

const NARRATIVE_PROP = {
  type: "string",
  maxLength: 2400,
  description:
    "Narrative prose. Separate paragraphs with a blank line; each paragraph renders separately. No em-dashes.",
};

// ─── Tool definitions ─────────────────────────────────────────────────────

export const TOOLS: ToolDefinition[] = [
  {
    name: "list_properties",
    description:
      "List every property with its client name and reports (id, title, status). Start here to find the report_id to author against.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: async (db, rawArgs) => {
      parseArgs(listPropertiesArgsSchema, rawArgs);
      const { data: props, error: pErr } = await db
        .from("properties")
        .select("id, address, city, state, property_name, client_user_id")
        .order("created_at", { ascending: true });
      if (pErr) throw new McpToolError(`properties lookup failed: ${pErr.message}`);
      const properties = (props ?? []) as PropertyRow[];

      const { data: reps, error: rErr } = await db
        .from("reports")
        .select("id, property_id, title, status, updated_at");
      if (rErr) throw new McpToolError(`reports lookup failed: ${rErr.message}`);
      const reports = (reps ?? []) as ReportRow[];

      const clientIds = [...new Set(properties.map((p) => p.client_user_id))];
      const profilesById = new Map<string, { full_name: string | null; email: string | null }>();
      if (clientIds.length > 0) {
        const { data: profiles, error: prErr } = await db
          .from("profiles")
          .select("id, full_name, email")
          .in("id", clientIds);
        if (prErr) throw new McpToolError(`profiles lookup failed: ${prErr.message}`);
        for (const row of (profiles ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>) {
          profilesById.set(row.id, { full_name: row.full_name, email: row.email });
        }
      }

      const result = properties.map((p) => {
        const profile = profilesById.get(p.client_user_id);
        return {
          property_id: p.id,
          property_name: p.property_name,
          address: [p.address, p.city, p.state].filter(Boolean).join(", "),
          client_name: profile?.full_name ?? null,
          client_email: profile?.email ?? null,
          reports: reports
            .filter((r) => r.property_id === p.id)
            .map((r) => ({
              report_id: r.id,
              title: r.title,
              status: r.status,
              updated_at: r.updated_at,
            })),
        };
      });
      return {
        result,
        summary: `Listed ${result.length} properties / ${reports.length} reports`,
      };
    },
  },
  {
    name: "get_report",
    description:
      "Table of contents for one report: every page with its page_key, title, group, status, inferred page type, populated structured fields, and missing fields.",
    inputSchema: {
      type: "object",
      properties: { report_id: REPORT_ID_PROP },
      required: ["report_id"],
      additionalProperties: false,
    },
    handler: async (db, rawArgs) => {
      const args = parseArgs(getReportArgsSchema, rawArgs);
      const report = await requireReport(db, args.report_id);
      const rows = await fetchQaRows(db, args.report_id);
      return {
        result: {
          report,
          pages: rows.map((r) => summarizePageFields(r)),
        },
        summary: `Read report ${args.report_id} TOC (${rows.length} pages)`,
      };
    },
  },
  {
    name: "get_page",
    description:
      "Full report_pages row for one page: typed blocks (narrative), structured columns, status, and images. Use before re-authoring an existing page.",
    inputSchema: {
      type: "object",
      properties: { report_id: REPORT_ID_PROP, page_key: PAGE_KEY_PROP },
      required: ["report_id", "page_key"],
      additionalProperties: false,
    },
    handler: async (db, rawArgs) => {
      const args = parseArgs(getPageArgsSchema, rawArgs);
      const { data, error } = await db
        .from("report_pages")
        .select(
          "id, report_id, page_key, title, group_name, status, sort_order, narrative, condition_rating, specs, key_observations, tiers, current_age_years, expected_lifespan_years, maintenance, images, created_at, updated_at",
        )
        .eq("report_id", args.report_id)
        .eq("page_key", args.page_key)
        .maybeSingle();
      if (error) throw new McpToolError(`report_pages lookup failed: ${error.message}`);
      if (!data) {
        throw new McpToolError(
          `No page ${args.page_key} in report ${args.report_id}. Call get_report for the TOC.`,
        );
      }
      return {
        result: data,
        summary: `Read page ${args.page_key} of report ${args.report_id}`,
      };
    },
  },
  {
    name: "upsert_room_page",
    description:
      "Create or update a room (interior/exterior space) page from structured fields: dims, finishes, fixtures, observations, condition rating. Renders as a room record card, never flat prose. Unknown fields must be omitted; they display as 'Not yet documented'.",
    inputSchema: {
      type: "object",
      properties: {
        report_id: REPORT_ID_PROP,
        page_key: PAGE_KEY_PROP,
        title: { type: "string", maxLength: 120, description: "Page title, e.g. Primary Suite." },
        group: {
          type: "string",
          maxLength: 60,
          description: "Chapter group label, e.g. Interior Spaces or Exterior Spaces.",
        },
        content: {
          type: "object",
          additionalProperties: false,
          properties: {
            narrative: NARRATIVE_PROP,
            dims: { type: "string", maxLength: 160, description: 'e.g. "14 x 16"' },
            floorSqft: { type: "number", exclusiveMinimum: 0 },
            ceiling: { type: "string", maxLength: 160, description: 'e.g. "9ft tray"' },
            floorLevel: { type: "string", maxLength: 160, description: 'e.g. "Main Floor"' },
            finishes: {
              type: "object",
              additionalProperties: false,
              properties: {
                wallPaint: { type: "string", maxLength: 160 },
                trimPaint: { type: "string", maxLength: 160 },
                ceilingPaint: { type: "string", maxLength: 160 },
                flooring: { type: "string", maxLength: 160 },
              },
            },
            fixtures: {
              type: "object",
              additionalProperties: false,
              properties: {
                lighting: { type: "string", maxLength: 160 },
                outlets: { type: "string", maxLength: 160 },
                windows: { type: "string", maxLength: 160 },
                doors: { type: "string", maxLength: 160 },
              },
            },
            observations: OBSERVATIONS_PROP,
            conditionRating: CONDITION_PROP,
            specs: SPEC_ITEMS_PROP,
          },
        },
      },
      required: ["report_id", "page_key", "title", "group", "content"],
      additionalProperties: false,
    },
    handler: async (db, rawArgs) => {
      const args = parseArgs(upsertRoomPageArgsSchema, rawArgs);
      const now = new Date().toISOString();
      const payload = buildRoomPagePayload({
        title: args.title,
        group: args.group,
        content: args.content,
        now,
      });
      const outcome = await upsertReportPage(db, {
        report_id: args.report_id,
        page_key: args.page_key,
        title: args.title,
        group: args.group,
        blocks: payload.blocks,
        columns: payload.columns,
        now,
      });
      return {
        result: { page_key: args.page_key, pageType: "room", ...outcome },
        summary: `${outcome.created ? "Created" : "Updated"} room page ${args.page_key}`,
      };
    },
  },
  {
    name: "upsert_system_page",
    description:
      "Create or update a system or appliance page: make/model/serial/install date, lifespan, condition, observations, and an optional replacement briefing with Essential/Enhanced/Signature tiers. Derives current age and lifecycle columns. Set is_appliance true for appliances (simpler record, no briefing).",
    inputSchema: {
      type: "object",
      properties: {
        report_id: REPORT_ID_PROP,
        page_key: PAGE_KEY_PROP,
        title: { type: "string", maxLength: 120, description: "e.g. Furnace, Water Heater." },
        group: {
          type: "string",
          maxLength: 60,
          description: "Chapter group label, e.g. Systems and Appliances.",
        },
        is_appliance: {
          type: "boolean",
          description: "true for appliances (fridge, range). Default false.",
        },
        content: {
          type: "object",
          additionalProperties: false,
          properties: {
            narrative: NARRATIVE_PROP,
            make: { type: "string", maxLength: 160 },
            model: { type: "string", maxLength: 160 },
            serial: { type: "string", maxLength: 160 },
            installDate: {
              type: "string",
              maxLength: 160,
              description: 'ISO date or bare year, e.g. "2009".',
            },
            lifespanYears: { type: "number", exclusiveMinimum: 0 },
            currentAgeYears: { type: "number", minimum: 0 },
            conditionRating: CONDITION_PROP,
            statusFlags: {
              type: "array",
              maxItems: 4,
              items: { type: "string", maxLength: 160 },
              description: 'e.g. ["Approaching End-of-Life"]. First flag shows as the status chip.',
            },
            specs: SPEC_ITEMS_PROP,
            observations: OBSERVATIONS_PROP,
            needsBriefing: {
              type: "boolean",
              description:
                "true to attach a replacement-briefing block even before details are known.",
            },
            replacementBriefing: {
              type: "object",
              additionalProperties: false,
              description: "Pre-scoped replacement details. All optional; systems only.",
              properties: {
                capacity: { type: "string", maxLength: 160 },
                voltage: { type: "string", maxLength: 160 },
                gasLine: { type: "string", maxLength: 160 },
                condensate: { type: "string", maxLength: 160 },
                ductworkNotes: { type: "string", maxLength: 400 },
                accessNotes: { type: "string", maxLength: 400 },
                tiers: TIER_SET_PROP,
              },
            },
          },
        },
      },
      required: ["report_id", "page_key", "title", "group", "content"],
      additionalProperties: false,
    },
    handler: async (db, rawArgs) => {
      const args = parseArgs(upsertSystemPageArgsSchema, rawArgs);
      const now = new Date().toISOString();
      const payload = buildSystemPagePayload({
        title: args.title,
        group: args.group,
        isAppliance: args.is_appliance,
        content: args.content,
        now,
      });
      const outcome = await upsertReportPage(db, {
        report_id: args.report_id,
        page_key: args.page_key,
        title: args.title,
        group: args.group,
        blocks: payload.blocks,
        columns: payload.columns,
        now,
      });
      return {
        result: { page_key: args.page_key, pageType: payload.pageType, ...outcome },
        summary: `${outcome.created ? "Created" : "Updated"} ${payload.pageType} page ${args.page_key}`,
      };
    },
  },
  {
    name: "upsert_vision_page",
    description:
      "Create or update a vision project page: aspirational vision prose, design-first education, design phase cost/weeks, priced Essential/Enhanced/Signature tiers, and execution path. AKR disclosure is always rendered. Tiers publish only when all three are fully priced; never invent prices.",
    inputSchema: {
      type: "object",
      properties: {
        report_id: REPORT_ID_PROP,
        page_key: PAGE_KEY_PROP,
        title: { type: "string", maxLength: 120, description: "e.g. Kitchen Vision Project." },
        group: { type: "string", maxLength: 60, description: "Chapter group label, e.g. Strategy." },
        content: {
          type: "object",
          additionalProperties: false,
          properties: {
            vision: {
              ...NARRATIVE_PROP,
              description:
                "Required. Warm, aspirational vision prose. Blank line between paragraphs. No em-dashes.",
            },
            whyDesignFirst: {
              type: "string",
              maxLength: 1600,
              description: "Why design matters first education prose.",
            },
            designPhaseWeeks: { type: "number", exclusiveMinimum: 0 },
            designPhaseCost: { type: "number", minimum: 0 },
            tiers: TIER_SET_PROP,
            executionPath: {
              type: "string",
              maxLength: 1600,
              description:
                "Execution path prose. Omit to use the standard AKR disclosure language.",
            },
            priorityWindow: { type: "string", maxLength: 160, description: 'e.g. "Year 1-2".' },
            category: {
              type: "string",
              maxLength: 160,
              description: 'e.g. "Lifestyle", "Critical", "Comfort".',
            },
            observations: OBSERVATIONS_PROP,
          },
          required: ["vision"],
        },
      },
      required: ["report_id", "page_key", "title", "group", "content"],
      additionalProperties: false,
    },
    handler: async (db, rawArgs) => {
      const args = parseArgs(upsertVisionPageArgsSchema, rawArgs);
      const now = new Date().toISOString();
      const payload = buildVisionPagePayload({
        title: args.title,
        content: args.content,
        now,
      });
      const outcome = await upsertReportPage(db, {
        report_id: args.report_id,
        page_key: args.page_key,
        title: args.title,
        group: args.group,
        blocks: payload.blocks,
        columns: payload.columns,
        now,
      });
      return {
        result: { page_key: args.page_key, pageType: "vision", ...outcome },
        summary: `${outcome.created ? "Created" : "Updated"} vision page ${args.page_key}`,
      };
    },
  },
  {
    name: "upsert_generic_page",
    description:
      "Create or update an Information-chapter page (welcome, how-to-use, executive summary) as headed sections of short paragraphs. Each section renders as a heading plus paragraphs; the caps make a wall of text impossible.",
    inputSchema: {
      type: "object",
      properties: {
        report_id: REPORT_ID_PROP,
        page_key: PAGE_KEY_PROP,
        title: { type: "string", maxLength: 120 },
        group: { type: "string", maxLength: 60, description: "Usually Information." },
        sections: {
          type: "array",
          minItems: 1,
          maxItems: 12,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              heading: { type: "string", maxLength: 120 },
              paragraphs: {
                type: "array",
                minItems: 1,
                maxItems: 6,
                items: { type: "string", maxLength: 900 },
                description: "Short paragraphs, max 900 chars each. No em-dashes.",
              },
            },
            required: ["heading", "paragraphs"],
          },
        },
      },
      required: ["report_id", "page_key", "title", "group", "sections"],
      additionalProperties: false,
    },
    handler: async (db, rawArgs) => {
      const args = parseArgs(upsertGenericPageArgsSchema, rawArgs);
      const now = new Date().toISOString();
      const blocks = buildGenericPageBlocks(args.sections, now);
      const outcome = await upsertReportPage(db, {
        report_id: args.report_id,
        page_key: args.page_key,
        title: args.title,
        group: args.group,
        blocks,
        columns: {
          condition_rating: null,
          specs: null,
          key_observations: null,
          tiers: null,
          current_age_years: null,
          expected_lifespan_years: null,
          maintenance: null,
          images: null,
        },
        now,
      });
      return {
        result: { page_key: args.page_key, pageType: "generic", sections: args.sections.length, ...outcome },
        summary: `${outcome.created ? "Created" : "Updated"} generic page ${args.page_key}`,
      };
    },
  },
  {
    name: "set_capital_plan",
    description:
      "Write the 10-year capital plan (Gantt rows) onto the capital-plan-10yr strategy page. Phases: defense (protect what's there), offense (upgrade existing), expansion (add footprint). Replaces any existing capital_plan block. Real cost ranges only.",
    inputSchema: {
      type: "object",
      properties: {
        report_id: REPORT_ID_PROP,
        startYear: { type: "integer", minimum: 2000, maximum: 2100 },
        items: {
          type: "array",
          minItems: 1,
          maxItems: 30,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              projectName: { type: "string", maxLength: 120 },
              phase: { type: "string", enum: ["defense", "offense", "expansion"] },
              yearStart: { type: "integer", minimum: 2000, maximum: 2100 },
              yearEnd: { type: "integer", minimum: 2000, maximum: 2100 },
              costLow: { type: "number", minimum: 0 },
              costHigh: { type: "number", minimum: 0 },
            },
            required: ["projectName", "phase", "yearStart"],
          },
        },
      },
      required: ["report_id", "items"],
      additionalProperties: false,
    },
    handler: async (db, rawArgs) => {
      const args = parseArgs(setCapitalPlanArgsSchema, rawArgs);
      const now = new Date().toISOString();
      const block = buildCapitalPlanBlock(args.items, now, 0, args.startYear);
      const outcome = await setStrategyBlock(
        db,
        args.report_id,
        { page_key: "capital-plan-10yr", title: "10-Year Capital Plan" },
        block,
        now,
      );
      return {
        result: { page_key: "capital-plan-10yr", items: args.items.length, ...outcome },
        summary: `Set capital plan (${args.items.length} projects)`,
      };
    },
  },
  {
    name: "set_recurring_services",
    description:
      "Write the recurring services register rows onto the recurring-services strategy page. Replaces any existing register block. Real costs only; omit unknown costs.",
    inputSchema: {
      type: "object",
      properties: {
        report_id: REPORT_ID_PROP,
        services: {
          type: "array",
          minItems: 1,
          maxItems: 40,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              category: { type: "string", maxLength: 160, description: "e.g. hvac, lawn_landscaping." },
              serviceName: { type: "string", maxLength: 120 },
              vendorName: { type: "string", maxLength: 120 },
              frequency: {
                type: "string",
                maxLength: 160,
                description: "e.g. weekly, monthly, quarterly, biannual, annual, as_needed.",
              },
              costPerVisit: { type: "number", minimum: 0 },
              annualCost: { type: "number", minimum: 0 },
              hbcManaged: { type: "boolean" },
            },
            required: ["category", "serviceName", "frequency"],
          },
        },
      },
      required: ["report_id", "services"],
      additionalProperties: false,
    },
    handler: async (db, rawArgs) => {
      const args = parseArgs(setRecurringServicesArgsSchema, rawArgs);
      const now = new Date().toISOString();
      const block = buildRecurringServicesBlock(args.services, now, 0);
      const outcome = await setStrategyBlock(
        db,
        args.report_id,
        { page_key: "recurring-services", title: "Recurring Services Register" },
        block,
        now,
      );
      return {
        result: { page_key: "recurring-services", services: args.services.length, ...outcome },
        summary: `Set recurring services (${args.services.length} rows)`,
      };
    },
  },
  {
    name: "set_maintenance_calendar",
    description:
      "Write the four-season maintenance calendar onto the maintenance-calendar strategy page. Each task pairs a short task with the system it belongs to. Replaces any existing calendar block.",
    inputSchema: {
      type: "object",
      properties: {
        report_id: REPORT_ID_PROP,
        seasons: {
          type: "object",
          additionalProperties: false,
          properties: {
            spring: { type: "array", maxItems: 20, items: MAINTENANCE_TASK_PROP() },
            summer: { type: "array", maxItems: 20, items: MAINTENANCE_TASK_PROP() },
            fall: { type: "array", maxItems: 20, items: MAINTENANCE_TASK_PROP() },
            winter: { type: "array", maxItems: 20, items: MAINTENANCE_TASK_PROP() },
          },
        },
      },
      required: ["report_id", "seasons"],
      additionalProperties: false,
    },
    handler: async (db, rawArgs) => {
      const args = parseArgs(setMaintenanceCalendarArgsSchema, rawArgs);
      const now = new Date().toISOString();
      const block = buildMaintenanceCalendarBlock(args.seasons, now, 0);
      const outcome = await setStrategyBlock(
        db,
        args.report_id,
        { page_key: "maintenance-calendar", title: "Maintenance Calendar" },
        block,
        now,
      );
      const total =
        args.seasons.spring.length +
        args.seasons.summer.length +
        args.seasons.fall.length +
        args.seasons.winter.length;
      return {
        result: { page_key: "maintenance-calendar", tasks: total, ...outcome },
        summary: `Set maintenance calendar (${total} tasks)`,
      };
    },
  },
  {
    name: "run_publish_qa",
    description:
      "Server-side publish QA for a report: per-page missing-structured-field report plus wall-of-text violations. Run this and fix every issue before publish_report.",
    inputSchema: {
      type: "object",
      properties: { report_id: REPORT_ID_PROP },
      required: ["report_id"],
      additionalProperties: false,
    },
    handler: async (db, rawArgs) => {
      const args = parseArgs(runPublishQaArgsSchema, rawArgs);
      await requireReport(db, args.report_id);
      const rows = await fetchQaRows(db, args.report_id);
      const issues = auditReportPageRows(rows);
      return {
        result: {
          passed: issues.length === 0,
          pages_checked: rows.length,
          issues,
        },
        summary: `QA ${issues.length === 0 ? "passed" : `found ${issues.length} issues`} (${rows.length} pages)`,
      };
    },
  },
  {
    name: "publish_report",
    description:
      'Publish a report to the client portal. Runs the same QA as run_publish_qa and refuses if any issue remains. Requires confirm to be the literal string "PUBLISH". Rebuilds the whole-report block union and flips report + pages to published.',
    inputSchema: {
      type: "object",
      properties: {
        report_id: REPORT_ID_PROP,
        confirm: {
          type: "string",
          enum: ["PUBLISH"],
          description: 'Must be exactly "PUBLISH". Ask Adam before calling this.',
        },
      },
      required: ["report_id", "confirm"],
      additionalProperties: false,
    },
    handler: async (db, rawArgs) => {
      const args = parseArgs(publishReportArgsSchema, rawArgs);
      await requireReport(db, args.report_id);
      const rows = await fetchQaRows(db, args.report_id);
      if (rows.length === 0) {
        throw new McpToolError("Report has no pages; nothing to publish.");
      }
      const issues = auditReportPageRows(rows);
      if (issues.length > 0) {
        return {
          result: {
            published: false,
            reason: "Publish QA failed. Fix every issue, re-run run_publish_qa, then publish.",
            issues,
          },
          summary: `Publish blocked by ${issues.length} QA issues`,
        };
      }

      const now = new Date().toISOString();
      // Whole-report block union with chapter headers, matching Step5Publish.
      const reportBlocks: ReportBlock[] = [];
      let order = 0;
      for (const row of rows) {
        const header = makeBlock(
          "chapter_header",
          order,
          { title: row.title, chapterId: row.page_key },
          now,
        );
        reportBlocks.push(header);
        order += 1;
        const blocks = Array.isArray(row.narrative)
          ? (row.narrative as ReportBlock[])
          : [];
        for (const b of blocks) {
          reportBlocks.push({ ...b, order });
          order += 1;
        }
      }

      const { error: blocksErr } = await db
        .from("reports")
        .update({ blocks_json: reportBlocks, status: "published", updated_at: now })
        .eq("id", args.report_id);
      if (blocksErr) {
        throw new McpToolError(`reports publish update failed: ${blocksErr.message}`);
      }

      const { error: pagesErr } = await db
        .from("report_pages")
        .update({ status: "published", updated_at: now })
        .eq("report_id", args.report_id);
      if (pagesErr) {
        throw new McpToolError(`report_pages publish update failed: ${pagesErr.message}`);
      }

      return {
        result: { published: true, pages: rows.length, published_at: now },
        summary: `Published report ${args.report_id} (${rows.length} pages)`,
      };
    },
  },
];

function MAINTENANCE_TASK_PROP(): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      task: { type: "string", maxLength: 160, description: 'e.g. "Replace HVAC filter".' },
      system: { type: "string", maxLength: 160, description: 'e.g. "Furnace".' },
    },
    required: ["task", "system"],
  };
}

export function findTool(name: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.name === name);
}
