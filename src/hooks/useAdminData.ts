import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminClient {
  id: string; // property id
  propertyId: string;
  propertyName: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  yearBuilt: number | null;
  sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  reportStatus: "draft" | "review" | "published";
  reportId: string | null;
  reportVersion: string;
  lastUpdated: string;
  unreadComments: number;
  totalPages: number;
  completePages: number;
  flaggedPages: number;
  openQuestions: number;
  clientUserId: string;
}

export function useAdminClients() {
  return useQuery({
    queryKey: ["admin-clients"],
    queryFn: async (): Promise<AdminClient[]> => {
      // Fetch properties with their reports
      const { data: properties, error: propErr } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (propErr) throw propErr;
      if (!properties || properties.length === 0) return [];

      // Fetch all reports
      const { data: reports } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch all report pages
      const { data: reportPages } = await supabase
        .from("report_pages")
        .select("*");

      // Fetch profiles
      const userIds = [...new Set(properties.map((p) => p.client_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      return properties.map((prop) => {
        const profile = profiles?.find((p) => p.user_id === prop.client_user_id);
        const report = reports?.find((r) => r.property_id === prop.id);
        const pages = reportPages?.filter((p) => p.report_id === report?.id) || [];
        const metadata = (prop.metadata as Record<string, unknown>) || {};

        const completePages = pages.filter((p) => p.status === "complete" || p.status === "published").length;
        const flaggedPages = pages.filter((p) => p.status === "needs_review").length;

        return {
          id: prop.id,
          propertyId: prop.id,
          propertyName: prop.property_name || prop.address,
          name: profile?.full_name || "Unknown Client",
          email: (profile as Record<string, unknown>)?.email as string || "",
          phone: (profile as Record<string, unknown>)?.phone as string || "",
          address: prop.address,
          yearBuilt: (metadata.year_built as number) || null,
          sqft: (metadata.sqft as number) || null,
          bedrooms: (metadata.bedrooms as number) || null,
          bathrooms: (metadata.bathrooms as number) || null,
          reportStatus: (report?.status as "draft" | "review" | "published") || "draft",
          reportId: report?.id || null,
          reportVersion: "v1",
          lastUpdated: report?.updated_at || prop.updated_at,
          unreadComments: 0,
          totalPages: pages.length,
          completePages,
          flaggedPages,
          openQuestions: 0,
          clientUserId: prop.client_user_id,
        };
      });
    },
  });
}

export function useAdminClient(propertyId: string | undefined) {
  const { data: clients, isLoading, error } = useAdminClients();
  const client = clients?.find((c) => c.id === propertyId) || null;
  return { client, isLoading, error };
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { count: totalProperties } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true });

      const { data: reports } = await supabase.from("reports").select("status");

      const inProgress = reports?.filter((r) => r.status === "draft" || r.status === "review").length || 0;
      const published = reports?.filter((r) => r.status === "published").length || 0;

      return {
        activeClients: totalProperties || 0,
        reportsInProgress: inProgress,
        unansweredQuestions: 0,
        publishedReports: published,
      };
    },
  });
}

export function useAdminReportPages(reportId: string | null | undefined) {
  return useQuery({
    queryKey: ["admin-report-pages", reportId],
    enabled: !!reportId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_pages")
        .select("*")
        .eq("report_id", reportId!)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}
