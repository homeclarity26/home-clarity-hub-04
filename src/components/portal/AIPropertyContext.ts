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

  const [
    propertyResult,
    reportPagesResult,
    projectsResult,
    invoiceResult,
    equipmentResult,
    goalsResult,
  ] = await Promise.all([
    // Property details
    (supabase.from("properties" as any) as any)
      .select("id, address, year_built, sqft, property_type, client_name")
      .eq("id", propertyId)
      .limit(1),

    // Report pages — fetch condition + priority info
    (supabase.from("report_pages" as any) as any)
      .select("id, page_key, title, group_name, condition_rating, is_priority, narrative, specs_json, recommendations, blocks_json")
      .eq("property_id", propertyId)
      .order("sort_order", { ascending: true }),

    // Active projects
    (supabase.from("projects" as any) as any)
      .select("id, title, status, phase, progress_percent, total_cost, next_milestone")
      .eq("property_id", propertyId)
      .in("status", ["active", "in_progress", "planning"])
      .order("updated_at", { ascending: false })
      .limit(5),

    // Latest unpaid invoice
    (supabase.from("invoices" as any) as any)
      .select("id, title, status, balance_due, total, due_date")
      .eq("property_id", propertyId)
      .not("status", "eq", "paid")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(1),

    // Equipment — flag aging/critical items
    (supabase.from("equipment" as any) as any)
      .select("id, name, type, category, model, year_installed, notes, is_aging, is_critical, flagged_aging, flagged_critical")
      .eq("property_id", propertyId)
      .order("name", { ascending: true }),

    // Client goals
    (supabase.from("client_goals" as any) as any)
      .select("id, title, status, target_year, estimated_budget")
      .eq("property_id", propertyId)
      .order("sort_order", { ascending: true }),
  ]);

  const property = propertyResult.data?.[0] || null;
  const rawPages = reportPagesResult.data || [];
  const projects: AIProjectItem[] = projectsResult.data || [];
  const rawInvoice = invoiceResult.data?.[0] || null;
  const rawEquipment = equipmentResult.data || [];
  const goals = goalsResult.data || [];

  // Map report pages to AI format
  const pages: AIReportPage[] = rawPages.map((p: any) => ({
    id: p.page_key || p.id,
    title: p.title || "Untitled",
    group: p.group_name || "",
    conditionRating: p.condition_rating || "Not assessed",
    priority: p.is_priority || false,
    narrative: p.narrative || "",
    specs: p.specs_json || {},
    recommendations: p.recommendations || [],
  }));

  // Calculate report completion
  const totalPages = pages.length || 57;
  const assessedPages = pages.filter((p) => p.conditionRating && p.conditionRating !== "Not assessed").length;
  const reportCompletionPercent = totalPages > 0 ? Math.round((assessedPages / totalPages) * 100) : 0;

  // Map equipment
  const equipment: AIEquipmentItem[] = rawEquipment.map((e: any) => ({
    id: e.id,
    name: e.name,
    type: e.type,
    category: e.category,
    model: e.model,
    year: e.year_installed,
    notes: e.notes,
    is_aging: e.is_aging || e.flagged_aging,
    is_critical: e.is_critical || e.flagged_critical,
  }));

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

  return {
    propertyId,
    propertyName: property?.client_name || property?.address || undefined,
    propertyAddress: property?.address || undefined,
    yearBuilt: property?.year_built ?? null,
    sqft: property?.sqft ?? null,
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
      target_year: g.target_year,
      estimated_budget: g.estimated_budget,
    })),
  };
}
