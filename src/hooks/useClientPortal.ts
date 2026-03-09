import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { reportPages as staticPages, reportGroups as staticGroups, type ReportPageData } from "@/data/reportContent";

export interface PortalGroup {
  id: string;
  title: string;
  pages: string[]; // page_key values
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
}

export function useClientPortal(propertyId?: string) {
  const { user } = useAuth();
  const [property, setProperty] = useState<PortalProperty | null>(null);
  const [report, setReport] = useState<PortalReport | null>(null);
  const [dbPages, setDbPages] = useState<DbPage[]>([]);
  const [creatorName, setCreatorName] = useState<string>("Your HBC Team");
  const [creatorProfile, setCreatorProfile] = useState<{ name: string; email?: string; phone?: string; initials: string }>({ name: "Your HBC Team", initials: "HB" });
  const [isLoading, setIsLoading] = useState(true);
  const [hasDbData, setHasDbData] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    async function load() {
      try {
        // 1. Fetch property
        let propQuery = supabase.from("properties").select("*");
        if (propertyId) {
          propQuery = propQuery.eq("id", propertyId);
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

        // 3. Fetch creator name
        const { data: creatorProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", rpt.created_by)
          .limit(1);

        if (creatorProfile && creatorProfile.length > 0 && creatorProfile[0].full_name) {
          setCreatorName(creatorProfile[0].full_name);
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
      } catch (err) {
        console.error("Error loading portal data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [user, propertyId]);

  // Build groups from DB pages
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

  // Build pages map from DB
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
      };
    }
    return map;
  }, [hasDbData, dbPages]);

  // Map page_key → DB uuid
  const pageKeyToDbId: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of dbPages) {
      map[p.page_key] = p.id;
    }
    return map;
  }, [dbPages]);

  // Completion percentage
  const completionPercent = useMemo(() => {
    if (dbPages.length === 0) return 0;
    const done = dbPages.filter((p) => p.status === "complete").length;
    return Math.round((done / dbPages.length) * 100);
  }, [dbPages]);

  // Images map: page_key → string[]
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
    hasDbData,
    isLoading,
  };
}
