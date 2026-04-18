import { supabase } from "@/integrations/supabase/client";

export interface AIEquipmentItem {
  id: string;
  name: string;
  type?: string;
  category?: string;
  model?: string;
  year?: number | null;
  notes?: string | null;
  is_aging?: boolean;
  is_critical?: boolean;
  flagged_aging?: boolean;
  flagged_critical?: boolean;
}

export interface AIProjectItem {
  id: string;
  title: string;
  status: string;
  phase?: string | null;
  progress_percent?: number | null;
  total_cost?: number | null;
  next_milestone?: string | null;
}

export interface AIInvoice {
  id: string;
  title?: string | null;
  status: string;
  balance_due?: number | null;
  total?: number | null;
  due_date?: string | null;
}

export interface AIReportPage {
  id: string;
  title: string;
  group?: string;
  conditionRating?: string;
  priority?: boolean;
  is_priority?: boolean;
  narrative?: string | string[];
  specs?: Record<string, unknown>;
  tiers?: { label: string; cost: string }[];
  recommendations?: string[];
}

export interface AIContext {
  propertyId: string;
  propertyName?: string;
  propertyAddress?: string;
  yearBuilt?: number | null;
  sqft?: number | null;
  propertyType?: string | null;
  reportCompletionPercent?: number;
  pages?: AIReportPage[];
  projects?: AIProjectItem[];
  latestInvoice?: AIInvoice | null;
  invoiceBalance?: number | null;
  equipment?: AIEquipmentItem[];
  goals?: { title: string; status: string; target_year?: number | null; estimated_budget?: number | null }[];
}

/**
 * Assembles the full AI context for a property.
 * Fetches property details, report pages, active projects, latest invoice,
 * equipment, and client goals in parallel.
 */
export async function buildPropertyAIContext(propertyId: string): Promise<AIContext> {
  if (!propertyId || propertyId.startsWith("mock-")) {
    return { propertyId };
  }

  // Resolve the property's latest report id first — report_pages is keyed
  // by report_id, not property_id.
  const { data: latestReport } = await supabase
    .from("reports")
    .select("id")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const latestReportId = latestReport?.id ?? null;

  const [
    propertyResult,
    reportPagesResult,
    projectsResult,
    invoiceResult,
    equipmentResult,
    goalsResult,
  ] = await Promise.all([
    // Property details — only select columns that actually exist on the
    // properties table. `year_built` / `sqft` / `client_name` were phantom
    // columns: year_built + sqft live in `metadata` jsonb (when present),
    // and there is no client_name column — use property_name.
    supabase.from("properties")
      .select("id, address, property_name, property_type, metadata")
      .eq("id", propertyId)
      .limit(1),

    // Report pages — scope by the property's latest report.
    latestReportId
      ? supabase.from("report_pages")
          .select("id, page_key, title, group_name, condition_rating, narrative, specs, recommendations")
          .eq("report_id", latestReportId)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [], error: null } as const),

    // Active projects — schema uses `percent_complete`, `estimated_cost`
    // (not progress_percent / total_cost). `next_milestone` doesn't exist.
    supabase.from("projects")
      .select("id, title, status, phase, percent_complete, estimated_cost")
      .eq("property_id", propertyId)
      .in("status", ["active", "in_progress", "planning"])
      .order("updated_at", { ascending: false })
      .limit(5),

    // Latest unpaid invoice
    supabase.from("invoices")
      .select("id, title, status, balance_due, total, due_date")
      .eq("property_id", propertyId)
      .not("status", "eq", "paid")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(1),

    // Equipment — real columns are `category`, `install_date`, `condition`.
    // `type` / `year_installed` / `is_aging` / `is_critical` / `flagged_*`
    // were all phantom. Compute aging/critical from the real data instead.
    supabase.from("equipment")
      .select("id, name, category, brand, model, install_date, warranty_expiry, last_service_date, next_service_date, condition, notes")
      .eq("property_id", propertyId)
      .order("name", { ascending: true }),

    // Client goals — schema has `target_date` (not target_year) and no
    // `estimated_budget` column; use existing `progress` + `status`.
    supabase.from("client_goals")
      .select("id, title, status, category, target_date, progress")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: true }),
  ]);

  const property = propertyResult.data?.[0] || null;
  const rawPages = reportPagesResult.data || [];
  const rawProjects = projectsResult.data || [];
  const projects: AIProjectItem[] = rawProjects.map((p: any) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    phase: p.phase ?? null,
    progress_percent: p.percent_complete ?? null,
    total_cost: p.estimated_cost ?? null,
    next_milestone: null,
  }));
  const rawInvoice = invoiceResult.data?.[0] || null;
  const rawEquipment = equipmentResult.data || [];
  const goals = goalsResult.data || [];

  // Map report pages to AI format
  const pages: AIReportPage[] = rawPages.map((p: any) => ({
    id: p.page_key || p.id,
    title: p.title || "Untitled",
    group: p.group_name || "",
    conditionRating: p.condition_rating || "Not assessed",
    // `is_priority` isn't a real column; approximate from condition rating.
    priority: ["poor", "critical"].includes((p.condition_rating || "").toLowerCase()),
    narrative: p.narrative || "",
    specs: p.specs || {},
    recommendations: p.recommendations || [],
  }));

  // Calculate report completion
  const totalPages = pages.length || 57;
  const assessedPages = pages.filter((p) => p.conditionRating && p.conditionRating !== "Not assessed").length;
  const reportCompletionPercent = totalPages > 0 ? Math.round((assessedPages / totalPages) * 100) : 0;

  // Map equipment. Derive aging/critical from real data:
  // - aging: warranty expired OR installed >15 yrs ago OR condition in ['poor','fair']
  // - critical: condition = 'critical'
  const now = Date.now();
  const fifteenYearsAgo = new Date(now - 15 * 365 * 24 * 60 * 60 * 1000);
  const equipment: AIEquipmentItem[] = rawEquipment.map((e: any) => {
    const installDate = e.install_date ? new Date(e.install_date) : null;
    const warrantyExpiry = e.warranty_expiry ? new Date(e.warranty_expiry) : null;
    const condLower = (e.condition || "").toLowerCase();
    const isAging = (installDate && installDate < fifteenYearsAgo)
      || (warrantyExpiry && warrantyExpiry.getTime() < now)
      || ["poor", "fair"].includes(condLower);
    const isCritical = condLower === "critical";
    return {
      id: e.id,
      name: e.name,
      category: e.category,
      model: e.model,
      year: installDate ? installDate.getFullYear() : null,
      notes: e.notes,
      is_aging: Boolean(isAging),
      is_critical: isCritical,
    };
  });

  // Calculate total balance due
  let invoiceBalance: number | null = null;
  let latestInvoice: AIInvoice | null = null;
  if (rawInvoice) {
    latestInvoice = {
      id: rawInvoice.id,
      title: rawInvoice.title,
      status: rawInvoice.status,
      balance_due: rawInvoice.balance_due,
      total: rawInvoice.total,
      due_date: rawInvoice.due_date,
    };
    invoiceBalance = rawInvoice.balance_due ?? rawInvoice.total ?? null;
  }

  // year_built / sqft live in properties.metadata jsonb when present.
  const metadata: Record<string, unknown> = (property?.metadata as Record<string, unknown>) || {};
  const yearBuilt = typeof metadata.year_built === "number" ? metadata.year_built : null;
  const sqft = typeof metadata.sqft === "number" ? metadata.sqft : null;

  return {
    propertyId,
    propertyName: property?.property_name || property?.address || undefined,
    propertyAddress: property?.address || undefined,
    yearBuilt,
    sqft,
    propertyType: property?.property_type ?? null,
    reportCompletionPercent,
    pages,
    projects,
    latestInvoice,
    invoiceBalance,
    equipment,
    goals: goals.map((g: any) => ({
      title: g.title,
      status: g.status,
      target_year: g.target_date ? new Date(g.target_date).getFullYear() : null,
      estimated_budget: null,
    })),
  };
}
