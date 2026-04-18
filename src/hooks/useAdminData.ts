import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminClient {
  id: string;
  propertyId: string;
  propertyName: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  county: string | null;
  propertyType: string | null;
  relationshipType: string | null;
  yearBuilt: number | null;
  sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  reportStatus: "draft" | "review" | "published";
  reportId: string | null;
  reportVersion: string;
  lastUpdated: string;
  unreadComments: number;
  unreadMessages: number;
  totalPages: number;
  completePages: number;
  flaggedPages: number;
  openQuestions: number;
  clientUserId: string;
  discoveryNotes: string | null;
  clientIntelligenceSummary: string | null;
  hoverUrl: string | null;
  hoverPdfUrl: string | null;
  iguideUrl: string | null;
  iguidePdfUrl: string | null;
  intakeStatus: string | null;
  digitalAssetsStatus: string | null;
}

export function useAdminClients() {
  return useQuery({
    queryKey: ["admin-clients"],
    queryFn: async (): Promise<AdminClient[]> => {
      const { data: properties, error: propErr } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false }) as { data: any[] | null; error: any };

      if (propErr) throw propErr;
      if (!properties || properties.length === 0) return [];

      const { data: reports } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: reportPages } = await supabase
        .from("report_pages")
        .select("*");

      // Fetch unread message counts per property
      const { data: unreadMessages } = await (supabase
        .from("property_messages"))
        .select("property_id")
        .eq("is_read", false);

      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // Count unread messages not sent by the current user, grouped by property
      const unreadByProperty: Record<string, number> = {};
      if (unreadMessages && currentUser) {
        for (const msg of unreadMessages as { property_id: string; sender_id: string }[]) {
          if ((msg as any).sender_id !== currentUser.id) {
            unreadByProperty[msg.property_id] = (unreadByProperty[msg.property_id] || 0) + 1;
          }
        }
      }

      const userIds = [...new Set(properties.map((p) => p.client_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone, avatar_initials")
        .in("user_id", userIds);

      return properties.map((prop) => {
        const profile = profiles?.find((p) => p.user_id === prop.client_user_id);
        const report = reports?.find((r) => r.property_id === prop.id);
        const pages = reportPages?.filter((p) => p.report_id === report?.id) || [];
        const metadata = (prop.metadata as Record<string, unknown>) || {};

        const completePages = pages.filter((p) => p.status === "complete" || p.status === "published").length;
        const flaggedPages = pages.filter((p) => p.status === "needs_review").length;

        // Use profile data first, fall back to metadata from wizard
        const clientEmail = profile?.email || (metadata.client_email as string) || "";
        const clientPhone = profile?.phone || (metadata.client_phone as string) || "";
        const clientName = profile?.full_name || (metadata.client_name as string) || "Unknown Client";

        return {
          id: prop.id,
          propertyId: prop.id,
          propertyName: prop.property_name || prop.address,
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
          address: prop.address,
          city: prop.city || null,
          state: prop.state || null,
          zip: prop.zip || null,
          county: prop.county || null,
          propertyType: prop.property_type || null,
          relationshipType: prop.relationship_type || null,
          yearBuilt: (metadata.year_built as number) || null,
          sqft: (metadata.sqft as number) || null,
          bedrooms: (metadata.bedrooms as number) || null,
          bathrooms: (metadata.bathrooms as number) || null,
          reportStatus: (report?.status as "draft" | "review" | "published") || "draft",
          reportId: report?.id || null,
          reportVersion: "v1",
          lastUpdated: report?.updated_at || prop.updated_at,
          unreadComments: 0,
          unreadMessages: unreadByProperty[prop.id] || 0,
          totalPages: pages.length,
          completePages,
          flaggedPages,
          openQuestions: 0,
          clientUserId: prop.client_user_id,
          discoveryNotes: prop.discovery_notes || null,
          clientIntelligenceSummary: prop.client_intelligence_summary || null,
          hoverUrl: prop.hover_url || null,
          hoverPdfUrl: prop.hover_pdf_url || null,
          iguideUrl: prop.iguide_url || null,
          iguidePdfUrl: prop.iguide_pdf_url || null,
          intakeStatus: prop.intake_status || null,
          digitalAssetsStatus: prop.digital_assets_status || null,
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

      const { count: unansweredQuestions } = await supabase
        .from("report_comments")
        .select("*", { count: "exact", head: true })
        .eq("resolved", false)
        .eq("comment_type", "question");

      const inProgress = reports?.filter((r) => r.status === "draft" || r.status === "review").length || 0;
      const published = reports?.filter((r) => r.status === "published").length || 0;

      // Revenue metrics
      const { data: allInvoices } = await supabase
        .from("invoices")
        .select("total, balance_due, status, due_date");

      const totalInvoiced = allInvoices?.reduce((s, i) => s + Number(i.total), 0) || 0;
      const totalOutstanding = allInvoices?.reduce((s, i) => s + Number(i.balance_due), 0) || 0;
      const totalCollected = totalInvoiced - totalOutstanding;

      const { data: paymentsData } = await supabase
        .from("payments_posted")
        .select("amount");
      const totalPayments = paymentsData?.reduce((s, p) => s + Number(p.amount), 0) || 0;

      const now = new Date().toISOString().split("T")[0];
      const overdueInvoices = allInvoices?.filter(
        (i) => i.due_date && i.due_date < now && Number(i.balance_due) > 0
      ).length || 0;

      return {
        activeClients: totalProperties || 0,
        reportsInProgress: inProgress,
        unansweredQuestions: unansweredQuestions || 0,
        publishedReports: published,
        totalInvoiced,
        totalCollected: totalPayments,
        totalOutstanding,
        overdueInvoices,
      };
    },
  });
}

export function useClientsNeedingAttention() {
  return useQuery({
    queryKey: ["clients-needing-attention"],
    queryFn: async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return [];

      // Unread messages grouped by property
      const { data: unreadMsgs } = await (supabase
        .from("property_messages"))
        .select("property_id, sender_id")
        .eq("is_read", false);

      const msgByProp: Record<string, number> = {};
      if (unreadMsgs) {
        for (const m of unreadMsgs as { property_id: string; sender_id: string }[]) {
          if (m.sender_id !== currentUser.id) {
            msgByProp[m.property_id] = (msgByProp[m.property_id] || 0) + 1;
          }
        }
      }

      // Unanswered comments grouped by property
      const { data: openComments } = await supabase
        .from("report_comments")
        .select("report_page_id")
        .eq("resolved", false)
        .eq("comment_type", "question");

      // Get page→property mapping for comments
      const commentPageIds = [...new Set(openComments?.map(c => c.report_page_id) || [])];
      const commentsByProp: Record<string, number> = {};
      if (commentPageIds.length > 0) {
        const { data: pages } = await supabase
          .from("report_pages")
          .select("id, report_id")
          .in("id", commentPageIds);
        const reportIds = [...new Set(pages?.map(p => p.report_id) || [])];
        if (reportIds.length > 0) {
          const { data: reps } = await supabase
            .from("reports")
            .select("id, property_id")
            .in("id", reportIds);
          const reportToProp: Record<string, string> = {};
          reps?.forEach(r => { reportToProp[r.id] = r.property_id; });
          const pageToProp: Record<string, string> = {};
          pages?.forEach(p => { if (reportToProp[p.report_id]) pageToProp[p.id] = reportToProp[p.report_id]; });
          openComments?.forEach(c => {
            const propId = pageToProp[c.report_page_id];
            if (propId) commentsByProp[propId] = (commentsByProp[propId] || 0) + 1;
          });
        }
      }

      // Overdue invoices grouped by property
      const now = new Date().toISOString().split("T")[0];
      const { data: overdueInvs } = await supabase
        .from("invoices")
        .select("property_id, balance_due, due_date")
        .gt("balance_due", 0);

      const overduByProp: Record<string, number> = {};
      overdueInvs?.forEach(i => {
        if (i.due_date && i.due_date < now) {
          overduByProp[i.property_id] = (overduByProp[i.property_id] || 0) + 1;
        }
      });

      // Combine all property IDs
      const allPropIds = new Set([...Object.keys(msgByProp), ...Object.keys(commentsByProp), ...Object.keys(overduByProp)]);
      if (allPropIds.size === 0) return [];

      const { data: props } = await supabase
        .from("properties")
        .select("id, property_name, address")
        .in("id", [...allPropIds]);

      return (props || []).map(p => ({
        propertyId: p.id,
        propertyName: p.property_name || p.address,
        unreadMessages: msgByProp[p.id] || 0,
        openQuestions: commentsByProp[p.id] || 0,
        overdueInvoices: overduByProp[p.id] || 0,
      })).sort((a, b) => {
        const scoreA = a.unreadMessages + a.openQuestions * 2 + a.overdueInvoices * 3;
        const scoreB = b.unreadMessages + b.openQuestions * 2 + b.overdueInvoices * 3;
        return scoreB - scoreA;
      });
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

export function useAdminProjects(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["admin-projects", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("property_id", propertyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAdminInvoices(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["admin-invoices", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("property_id", propertyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAdminScheduleEvents(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["admin-schedule-events", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_events")
        .select("*")
        .eq("property_id", propertyId!)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAdminActivityLog(limit?: number) {
  return useQuery({
    queryKey: ["admin-activity-log", limit],
    queryFn: async () => {
      let query = supabase
        .from("activity_log")
        .select("*, properties(id, property_name, address)")
        .order("created_at", { ascending: false });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useKnowledgeTemplates(category?: string) {
  return useQuery({
    queryKey: ["knowledge-templates", category],
    queryFn: async () => {
      let query = supabase
        .from("knowledge_templates")
        .select("*")
        .order("title", { ascending: true });
      if (category) query = query.eq("category", category);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}
