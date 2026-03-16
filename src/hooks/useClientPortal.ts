import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { reportPages as staticPages, reportGroups as staticGroups, type ReportPageData } from "@/data/reportContent";

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
  health_bar: unknown;
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
}

export function useClientPortal(propertyId?: string) {
  const { user, isCreator } = useAuth();
  const [property, setProperty] = useState<PortalProperty | null>(null);
  const [report, setReport] = useState<PortalReport | null>(null);
  const [dbPages, setDbPages] = useState<DbPage[]>([]);
  const [creatorName, setCreatorName] = useState<string>("Your HBC Team");
  const [creatorProfile, setCreatorProfile] = useState<{ name: string; email?: string; phone?: string; initials: string }>({ name: "Your HBC Team", initials: "HB" });
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
        });

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

  const groups: PortalGroup[] = useMemo(() => {
    if (!hasDbData) return staticGroups;
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
  }, [hasDbData, dbPages]);

  const pages: Record<string, ReportPageData> = useMemo(() => {
    if (!hasDbData) return staticPages;
    const map: Record<string, ReportPageData> = {};
    for (const p of dbPages) {
      map[p.page_key] = {
        id: p.page_key,
        title: p.title,
        group: p.group_name,
        conditionRating: p.condition_rating as ReportPageData["conditionRating"],
        narrative: (p.narrative as string[]) || [],
        healthBar: p.health_bar as ReportPageData["healthBar"],
        specs: (p.specs as { label: string; value: string }[]) || undefined,
        tiers: p.tiers as ReportPageData["tiers"],
        timing: p.timing || undefined,
        recommendations: (p.recommendations as string[]) || undefined,
        key_observations: (p.key_observations as string[]) || undefined,
        risks: (p.risks as string[]) || undefined,
        dependencies: (p.dependencies as { pageKey: string; title: string; type: "before" | "after" }[]) || undefined,
        maintenance: (p.maintenance as { frequency?: string; tasks: string[] }) || undefined,
        creator_notes: p.creator_notes || undefined,
      } as ReportPageData;
    }
    return map;
  }, [hasDbData, dbPages]);

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
    hasDbData,
    isLoading,
    invoiceBalance,
  };
}
