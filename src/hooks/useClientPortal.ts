import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { reportPages as staticPages, reportGroups as staticGroups, type ReportPageData } from "@/data/reportContent";
import { BLOCK_TEMPLATES, type ReportBlock } from "@/components/wysiwyg/types";
import { normalizeConditionRating } from "@/lib/reportPageSchemas";
import { paragraphsToHtml } from "@/lib/wizardPublishMapping";

export interface PortalGroup {
  id: string;
  title: string;
  pages: string[];
}

export interface PortalProperty {
  id: string;
  property_name: string | null;
  address: string;
  estimated_value: number | null;
  year_built?: number | null;
  sqft?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  property_type?: string | null;
  relationship_type?: string | null;
  client_intelligence_summary?: string | null;
  hover_url?: string | null;
  hover_pdf_url?: string | null;
  iguide_url?: string | null;
  iguide_pdf_url?: string | null;
  // Admin-uploaded front-of-house photo — used as the portal hero and report cover
  hero_image_url?: string | null;
}

export interface PortalReport {
  id: string;
  title: string;
  status: string;
  created_by: string;
}

interface DbPage {
  id: string;
  page_key: string;
  title: string;
  group_name: string;
  condition_rating: string | null;
  narrative: unknown;
  specs: unknown;
  tiers: unknown;
  timing: string | null;
  recommendations: unknown;
  images: unknown;
  status: string;
  sort_order: number;
  block_config: unknown;
  key_observations: unknown;
  risks: unknown;
  dependencies: unknown;
  maintenance: unknown;
  creator_notes: string | null;
  last_inspected_date: string | null;
  next_review_date: string | null;
  expected_lifespan_years: number | null;
  current_age_years: number | null;
  replacement_cost_today: number | null;
  findings: unknown;
  is_complete: boolean | null;
}

// ─── Legacy narrative auto-upgrade (Phase 1, commit 4) ─────────────────────
// Pre-rebuild rows carry `report_pages.narrative` as a bare `string[]` of
// paragraphs. When such a page also has empty structured fields it would
// fall through to the legacy renderer as a wall of bare <p> tags. At read
// time (never in the DB) we upgrade those pages: the paragraphs become the
// observations array and a typed block (room_record / system_record /
// vision_project) so ReportTab routes them through the styled templates.

type LegacyUpgradeTemplate = "room" | "system" | "appliance" | "vision" | null;

function inferLegacyTemplate(
  groupName: string,
  pageKey: string,
): LegacyUpgradeTemplate {
  const gid = (groupName || "").toLowerCase().replace(/\s+/g, "-");
  const k = (pageKey || "").toLowerCase();
  if (gid === "appliances" || gid.includes("appliance")) return "appliance";
  if (
    gid.startsWith("systems-") ||
    gid === "systems-and-appliances" ||
    gid.includes("system") ||
    gid.includes("hvac") ||
    gid.includes("mechanical") ||
    gid.includes("safety")
  ) {
    return "system";
  }
  if (gid === "strategy") {
    return k.includes("vision") || k.includes("project") ? "vision" : null;
  }
  if (k.includes("vision")) return "vision";
  if (
    gid === "spaces" ||
    gid.startsWith("interior") ||
    gid.startsWith("exterior") ||
    gid.includes("bedroom") ||
    gid.includes("bathroom") ||
    gid.includes("living") ||
    gid.includes("space")
  ) {
    return "room";
  }
  return null;
}

function templateDefault(type: ReportBlock["type"]): Record<string, unknown> {
  const template = BLOCK_TEMPLATES.find((t) => t.type === type);
  return template
    ? (JSON.parse(JSON.stringify(template.defaultContent)) as Record<
        string,
        unknown
      >)
    : {};
}

function makeLegacyBlock(
  type: ReportBlock["type"],
  pageKey: string,
  content: Record<string, unknown>,
): ReportBlock {
  const now = new Date().toISOString();
  return {
    id: `legacy-upgrade-${pageKey}`,
    type,
    content,
    colSpan: 12,
    order: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function buildLegacyUpgradeBlocks(
  template: Exclude<LegacyUpgradeTemplate, null>,
  page: DbPage,
  paragraphs: string[],
): ReportBlock[] {
  const conditionRating = normalizeConditionRating(page.condition_rating);
  if (template === "room") {
    return [
      makeLegacyBlock("room_record", page.page_key, {
        roomName: page.title,
        conditionRating,
        observationsHtml: paragraphsToHtml(paragraphs) || undefined,
        linkedVisionProjects: [],
      }),
    ];
  }
  if (template === "system" || template === "appliance") {
    // Prose lands in key_observations (rendered as the template's
    // Observations section); the record block carries identity + condition.
    return [
      makeLegacyBlock("system_record", page.page_key, {
        systemName: page.title,
        isAppliance: template === "appliance",
        conditionRating,
        specifications: [],
        maintenanceLog: [],
        routineCareItems: [],
        photos: {},
      }),
    ];
  }
  // Vision: locked AKR-disclosure execution language + unpriced tier
  // scaffolding come from the canonical block template.
  const defaults = templateDefault("vision_project");
  return [
    makeLegacyBlock("vision_project", page.page_key, {
      projectTitle: page.title,
      visionNarrativeHtml: paragraphsToHtml(paragraphs) || undefined,
      tiers: defaults.tiers ?? [],
      executionPathHtml: defaults.executionPathHtml,
      akrDisclosed: true,
    }),
  ];
}

// Mutation-free upgrade: returns replacement narrative blocks plus the
// observations array, or null when the page should stay on its current path.
function upgradeLegacyPage(
  page: DbPage,
): { blocks: ReportBlock[]; observations: string[] } | null {
  const narrativeVal = page.narrative;
  const isLegacyStringNarrative =
    Array.isArray(narrativeVal) &&
    narrativeVal.length > 0 &&
    typeof narrativeVal[0] === "string";
  if (!isLegacyStringNarrative) return null;

  const hasStructured =
    (Array.isArray(page.key_observations) && page.key_observations.length > 0) ||
    (Array.isArray(page.specs) && page.specs.length > 0) ||
    (page.tiers != null && typeof page.tiers === "object");
  if (hasStructured) return null;

  const template = inferLegacyTemplate(page.group_name, page.page_key);
  if (!template) return null;

  const paragraphs = (narrativeVal as unknown[])
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
  if (paragraphs.length === 0) return null;

  return {
    blocks: buildLegacyUpgradeBlocks(template, page, paragraphs),
    observations: template === "vision" ? [] : paragraphs,
  };
}

export function useClientPortal(propertyId?: string) {
  const { user, isCreator } = useAuth();
  const [property, setProperty] = useState<PortalProperty | null>(null);
  const [report, setReport] = useState<PortalReport | null>(null);
  const [dbPages, setDbPages] = useState<DbPage[]>([]);
  const [blocksJson, setBlocksJson] = useState<unknown[]>([]);
  const [creatorName, setCreatorName] = useState<string>("Your HBC Team");
  const [creatorProfile, setCreatorProfile] = useState<{ name: string; email?: string; phone?: string; initials: string }>({ name: "Your HBC Team", initials: "HB" });
  const [clientFirstName, setClientFirstName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasDbData, setHasDbData] = useState(false);
  const [invoiceBalance, setInvoiceBalance] = useState(0);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // ── DEV BYPASS: provide mock property/report when using mock auth ──
    if (user.id === "00000000-0000-0000-0000-000000000000") {
      setProperty({
        id: "mock-property-demo",
        property_name: "Johnson Residence",
        address: "1234 Maple Ridge Drive, Hudson, OH 44236",
        estimated_value: 425000,
      });
      setReport({
        id: "mock-report-demo",
        title: "Home Clarity Report",
        status: "published",
        created_by: "00000000-0000-0000-0000-000000000000",
      });
      setCreatorName("Adam Kilgore");
      setCreatorProfile({ name: "Adam Kilgore", email: "adam@homeclarityhub.com", phone: "(330) 555-0100", initials: "AK" });
      // Leave hasDbData false so it falls back to the rich static demo content
      setIsLoading(false);
      return;
    }
    // ────────────────────────────────────────────────────────────────────

    async function load() {
      try {
        // 1. Fetch property — scope by ownership for clients, allow all for creators
        let propQuery = supabase.from("properties").select("*");
        if (propertyId) {
          propQuery = propQuery.eq("id", propertyId);
        } else if (!isCreator) {
          // Clients only see their own properties
          propQuery = propQuery.eq("client_user_id", user!.id);
        }
        const { data: props } = await propQuery.limit(1);

        if (!props || props.length === 0) {
          setIsLoading(false);
          return;
        }

        const prop = props[0];
        setProperty({
          id: prop.id,
          property_name: prop.property_name,
          address: prop.address,
          estimated_value: prop.estimated_value,
          year_built: (prop as Record<string, unknown>).year_built as number | null ?? null,
          sqft: (prop as Record<string, unknown>).sqft as number | null ?? null,
          bedrooms: ((prop as Record<string, unknown>).metadata as Record<string, unknown> | null)?.bedrooms as number | null ?? null,
          bathrooms: ((prop as Record<string, unknown>).metadata as Record<string, unknown> | null)?.bathrooms as number | null ?? null,
          property_type: (prop as Record<string, unknown>).property_type as string | null ?? null,
          relationship_type: (prop as Record<string, unknown>).relationship_type as string | null ?? null,
          client_intelligence_summary: (prop as Record<string, unknown>).client_intelligence_summary as string | null ?? null,
          hover_url: (prop as Record<string, unknown>).hover_url as string | null ?? null,
          hover_pdf_url: (prop as Record<string, unknown>).hover_pdf_url as string | null ?? null,
          iguide_url: (prop as Record<string, unknown>).iguide_url as string | null ?? null,
          iguide_pdf_url: (prop as Record<string, unknown>).iguide_pdf_url as string | null ?? null,
          hero_image_url: (prop as Record<string, unknown>).hero_image_url as string | null ?? null,
        });

        // 2a. Fetch the client's profile so the portal can greet them by their
        // own first name — not the admin's — when an admin previews the portal.
        const clientUserId = (prop as Record<string, unknown>).client_user_id as string | null | undefined;
        if (clientUserId) {
          const { data: clientData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", clientUserId)
            .limit(1);
          const fullName = clientData?.[0]?.full_name;
          if (fullName) {
            setClientFirstName(fullName.split(" ")[0] || null);
          }
        }

        // 2. Fetch report for this property
        const { data: reports } = await supabase
          .from("reports")
          .select("*")
          .eq("property_id", prop.id)
          .limit(1);

        if (!reports || reports.length === 0) {
          setIsLoading(false);
          return;
        }

        const rpt = reports[0];
        setReport({
          id: rpt.id,
          title: rpt.title,
          status: rpt.status,
          created_by: rpt.created_by,
        });
        // Store blocks_json if present
        if ((rpt as Record<string, unknown>).blocks_json && Array.isArray((rpt as Record<string, unknown>).blocks_json)) {
          setBlocksJson((rpt as Record<string, unknown>).blocks_json as unknown[]);
        }

        // 3. Fetch creator profile
        const { data: creatorData } = await supabase
          .from("profiles")
          .select("full_name, email, phone")
          .eq("user_id", rpt.created_by)
          .limit(1);

        if (creatorData && creatorData.length > 0 && creatorData[0].full_name) {
          setCreatorName(creatorData[0].full_name);
          setCreatorProfile({
            name: creatorData[0].full_name,
            email: creatorData[0].email || undefined,
            phone: creatorData[0].phone || undefined,
            initials: (creatorData[0].full_name || "HB").slice(0, 2).toUpperCase(),
          });
        }

        // 4. Fetch all report pages
        const { data: pages } = await supabase
          .from("report_pages")
          .select("*")
          .eq("report_id", rpt.id)
          .order("sort_order", { ascending: true });

        if (pages && pages.length > 0) {
          setDbPages(pages as unknown as DbPage[]);
          setHasDbData(true);
        }

        // 5. Fetch invoice balance for this property
        const { data: invoices } = await supabase
          .from("invoices")
          .select("amount, status")
          .eq("property_id", prop.id);

        if (invoices) {
          const pending = invoices
            .filter(i => i.status === "pending" || i.status === "overdue")
            .reduce((sum, i) => sum + Number(i.amount), 0);
          setInvoiceBalance(pending);
        }
      } catch (err) {
        console.error("Error loading portal data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [user, propertyId, isCreator]);

  // Only the dev/demo mock user gets the rich static demo content as a
  // fallback. Real authenticated clients with no DB report data should see
  // an empty report — NOT fake "Primary Furnace rated poor" suggestions
  // that bleed into the Home tab quick actions and mislead the client.
  const isDemoMock = property?.id === "mock-property-demo";

  const groups: PortalGroup[] = useMemo(() => {
    if (!hasDbData) return isDemoMock ? staticGroups : [];
    const groupMap = new Map<string, { pages: { key: string; order: number }[] }>();
    for (const p of dbPages) {
      if (!groupMap.has(p.group_name)) {
        groupMap.set(p.group_name, { pages: [] });
      }
      groupMap.get(p.group_name)!.pages.push({ key: p.page_key, order: p.sort_order });
    }
    return Array.from(groupMap.entries()).map(([name, data]) => ({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      title: name,
      pages: data.pages.sort((a, b) => a.order - b.order).map((p) => p.key),
    }));
  }, [hasDbData, dbPages, isDemoMock]);

  const pages: Record<string, ReportPageData> = useMemo(() => {
    if (!hasDbData) return isDemoMock ? staticPages : {};
    const map: Record<string, ReportPageData> = {};
    for (const p of dbPages) {
      // Read-time upgrade for legacy string[] narratives with no structured
      // fields: paragraphs become the observations array and a typed block
      // so the page renders through the styled templates, never bare <p>
      // walls. The DB row is not modified.
      const upgrade = upgradeLegacyPage(p);
      const narrative = upgrade
        ? (upgrade.blocks as unknown as string[])
        : (p.narrative as string[]) || [];
      const keyObservations =
        upgrade && upgrade.observations.length > 0
          ? upgrade.observations
          : (p.key_observations as string[]) || undefined;
      map[p.page_key] = {
        id: p.page_key,
        title: p.title,
        group: p.group_name,
        conditionRating: p.condition_rating as ReportPageData["conditionRating"],
        narrative,
        specs: (p.specs as { label: string; value: string }[]) || undefined,
        tiers: p.tiers as ReportPageData["tiers"],
        timing: p.timing || undefined,
        recommendations: (p.recommendations as string[]) || undefined,
        key_observations: keyObservations,
        risks: (p.risks as string[]) || undefined,
        dependencies: (p.dependencies as { pageKey: string; title: string; type: "before" | "after" }[]) || undefined,
        maintenance: (p.maintenance as { frequency?: string; tasks: string[] }) || undefined,
        creator_notes: p.creator_notes || undefined,
        last_inspected_date: p.last_inspected_date || undefined,
        next_review_date: p.next_review_date || undefined,
        expected_lifespan_years: p.expected_lifespan_years || undefined,
        current_age_years: p.current_age_years || undefined,
        replacement_cost_today: p.replacement_cost_today || undefined,
        findings: (p.findings as unknown[]) || undefined,
        is_complete: p.is_complete || false,
      } as ReportPageData;
    }
    return map;
  }, [hasDbData, dbPages, isDemoMock]);

  const pageKeyToDbId: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of dbPages) {
      map[p.page_key] = p.id;
    }
    return map;
  }, [dbPages]);

  const completionPercent = useMemo(() => {
    if (dbPages.length > 0) {
      const done = dbPages.filter((p) => p.status === "complete").length;
      return Math.round((done / dbPages.length) * 100);
    }
    // When using static demo content, report is "complete"
    if (!hasDbData && report) {
      const pageCount = Object.keys(staticPages).length;
      return pageCount > 0 ? 100 : 0;
    }
    return 0;
  }, [dbPages, hasDbData, report]);

  const pageImages: Record<string, string[]> = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const p of dbPages) {
      if (p.images && Array.isArray(p.images) && (p.images as string[]).length > 0) {
        map[p.page_key] = p.images as string[];
      }
    }
    return map;
  }, [dbPages]);

  return {
    property,
    report,
    groups,
    pages,
    pageKeyToDbId,
    pageImages,
    completionPercent,
    creatorName,
    creatorProfile,
    clientFirstName,
    hasDbData,
    isLoading,
    invoiceBalance,
    blocksJson,
  };
}
