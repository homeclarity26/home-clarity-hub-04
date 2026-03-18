import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── Admin-side: Trade Partner Profile data ───

export function useVendorDetail(vendorId: string | undefined) {
  return useQuery({
    queryKey: ["vendor-detail", vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("central_vendors") as any).select("*").eq("id", vendorId).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useVendorProjects(vendorId: string | undefined) {
  return useQuery({
    queryKey: ["vendor-projects", vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      // Get tasks assigned to this vendor → get unique project IDs
      const { data: tasks } = await (supabase.from("project_tasks") as any).select("project_id").eq("assigned_vendor_id", vendorId);
      const projectIds = [...new Set((tasks || []).map((t: any) => t.project_id))] as string[];
      if (projectIds.length === 0) return [];
      const { data: projects } = await supabase.from("projects").select("*").in("id", projectIds).order("created_at", { ascending: false });
      return projects || [];
    },
  });
}

export function useVendorBids(vendorId: string | undefined) {
  return useQuery({
    queryKey: ["vendor-bids", vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      // contractor_bids doesn't have vendor_id, but has contractor_name — try matching
      // For now, get all bids and we'll filter by vendor in the component
      const { data } = await supabase.from("contractor_bids").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });
}

export function useVendorReviews(vendorId: string | undefined) {
  return useQuery({
    queryKey: ["vendor-reviews", vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const { data } = await (supabase.from("vendor_performance_reviews") as any).select("*").eq("vendor_id", vendorId).order("review_date", { ascending: false });
      return data || [];
    },
  });
}

export function useVendorTasks(vendorId: string | undefined) {
  return useQuery({
    queryKey: ["vendor-tasks", vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const { data } = await (supabase.from("project_tasks") as any).select("*, projects(title, status)").eq("assigned_vendor_id", vendorId).order("due_date", { ascending: true });
      return data || [];
    },
  });
}

// ─── Trade Partner Portal: own data ───

export function useMyVendorProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-vendor-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await (supabase.from("central_vendors") as any).select("*").eq("user_id", user!.id).single();
      return data;
    },
  });
}

export function useMyAssignedProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-assigned-projects", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // Get vendor profile first
      const { data: vendor } = await (supabase.from("central_vendors") as any).select("id").eq("user_id", user!.id).single();
      if (!vendor) return [];
      const { data: tasks } = await (supabase.from("project_tasks") as any).select("project_id").eq("assigned_vendor_id", vendor.id);
      const projectIds = [...new Set((tasks || []).map((t: any) => t.project_id))] as string[];
      if (projectIds.length === 0) return [];
      const { data: projects } = await supabase.from("projects").select("*").in("id", projectIds).order("created_at", { ascending: false });
      return projects || [];
    },
  });
}

export function useMyTasks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-tasks", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: vendor } = await (supabase.from("central_vendors") as any).select("id").eq("user_id", user!.id).single();
      if (!vendor) return [];
      const { data } = await (supabase.from("project_tasks") as any).select("*, projects(title)").eq("assigned_vendor_id", vendor.id).order("due_date", { ascending: true });
      return data || [];
    },
  });
}

export function useMyBids() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-bids", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // For now return all bids - in real app would filter by vendor email match
      const { data: vendor } = await (supabase.from("central_vendors") as any).select("id, company_name").eq("user_id", user!.id).single();
      if (!vendor) return [];
      const { data } = await supabase.from("contractor_bids").select("*, projects(title)").order("created_at", { ascending: false });
      // Filter by contractor_name matching vendor company_name
      return (data || []).filter((b: any) => b.contractor_name?.toLowerCase() === vendor.company_name?.toLowerCase());
    },
  });
}

export function useMyMessages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-messages", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await (supabase.from("project_messages") as any).select("*, projects(title)").eq("sender_id", user!.id).order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
  });
}

export function useMyProjectMessages(projectId: string | undefined) {
  return useQuery({
    queryKey: ["my-project-messages", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data } = await (supabase.from("project_messages") as any).select("*").eq("project_id", projectId).order("created_at", { ascending: true });
      return data || [];
    },
  });
}

export function useMyProjectFiles(projectId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-project-files", projectId, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      let query = (supabase.from("project_files") as any).select("*, projects(title)").order("created_at", { ascending: false });
      if (projectId) query = query.eq("project_id", projectId);
      // Only show files shared with trade partners or uploaded by them
      const { data } = await query;
      return (data || []).filter((f: any) => f.share_with_client || f.uploaded_by === user!.id);
    },
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { error } = await (supabase.from("project_tasks") as any).update({ status }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      toast.success("Task updated");
    },
  });
}

export function useSendProjectMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ projectId, message }: { projectId: string; message: string }) => {
      const { error } = await (supabase.from("project_messages") as any).insert({
        project_id: projectId,
        sender_id: user!.id,
        message,
        participant_type: "trade_partner",
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["my-project-messages", v.projectId] });
      qc.invalidateQueries({ queryKey: ["my-messages"] });
    },
  });
}

export function useCreateVendorReview() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (review: { vendor_id: string; project_id?: string; quality_rating: number; timeliness_rating: number; communication_rating: number; cost_accuracy_rating: number; notes?: string }) => {
      const { error } = await (supabase.from("vendor_performance_reviews") as any).insert({
        ...review,
        admin_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["vendor-reviews", v.vendor_id] });
      toast.success("Review saved");
    },
  });
}
