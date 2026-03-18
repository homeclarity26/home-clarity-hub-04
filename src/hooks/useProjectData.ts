import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export async function logProjectActivity(projectId: string, actionType: string, description: string, userId?: string) {
  await supabase.from("project_activity_log").insert({ project_id: projectId, user_id: userId || null, action_type: actionType, description });
}

export function useProjectPhases(projectId: string) {
  return useQuery({ queryKey: ["project-phases", projectId], enabled: !!projectId, queryFn: async () => { const { data } = await supabase.from("project_phases").select("*").eq("project_id", projectId).order("sort_order"); return data || []; } });
}

export function useCreatePhase() {
  const qc = useQueryClient(); const { user } = useAuth();
  return useMutation({ mutationFn: async (input: { project_id: string; name: string; sort_order: number; estimated_cost?: number }) => { const { error } = await supabase.from("project_phases").insert(input); if (error) throw error; await logProjectActivity(input.project_id, "phase_created", `Phase "${input.name}" added`, user?.id); }, onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["project-phases", v.project_id] }); qc.invalidateQueries({ queryKey: ["project-phases-overview", v.project_id] }); qc.invalidateQueries({ queryKey: ["project-activity-recent", v.project_id] }); qc.invalidateQueries({ queryKey: ["project-activity-log", v.project_id] }); } });
}

export function useUpdatePhaseStatus() {
  const qc = useQueryClient(); const { user } = useAuth();
  return useMutation({ mutationFn: async ({ phaseId, status, projectId, phaseName }: { phaseId: string; status: string; projectId: string; phaseName: string }) => { const { error } = await supabase.from("project_phases").update({ status }).eq("id", phaseId); if (error) throw error; await logProjectActivity(projectId, "phase_status_changed", `Phase "${phaseName}" → ${status.replace("_", " ")}`, user?.id); }, onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["project-phases", v.projectId] }); qc.invalidateQueries({ queryKey: ["project-phases-overview", v.projectId] }); qc.invalidateQueries({ queryKey: ["project-activity-recent", v.projectId] }); qc.invalidateQueries({ queryKey: ["project-activity-log", v.projectId] }); } });
}

export function useProjectTasks(projectId: string) {
  return useQuery({ queryKey: ["project-tasks", projectId], enabled: !!projectId, queryFn: async () => { const { data } = await supabase.from("project_tasks").select("*").eq("project_id", projectId).order("sort_order"); return data || []; } });
}

export function useCreateTask() {
  const qc = useQueryClient(); const { user } = useAuth();
  return useMutation({ mutationFn: async (input: { project_id: string; phase_id: string; title: string; sort_order: number }) => { const { error } = await supabase.from("project_tasks").insert(input); if (error) throw error; await logProjectActivity(input.project_id, "task_created", `Task "${input.title}" added`, user?.id); }, onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["project-tasks", v.project_id] }); qc.invalidateQueries({ queryKey: ["project-activity-recent", v.project_id] }); qc.invalidateQueries({ queryKey: ["project-activity-log", v.project_id] }); } });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ taskId, status, projectId }: { taskId: string; status: string; projectId: string }) => { const { error } = await supabase.from("project_tasks").update({ status }).eq("id", taskId); if (error) throw error; }, onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["project-tasks", v.projectId] }); } });
}

export function useChangeOrders(projectId: string) {
  return useQuery({ queryKey: ["project-change-orders", projectId], enabled: !!projectId, queryFn: async () => { const { data } = await supabase.from("project_change_orders").select("*").eq("project_id", projectId).order("created_at", { ascending: false }); return data || []; } });
}

export function useCreateChangeOrder() {
  const qc = useQueryClient(); const { user } = useAuth();
  return useMutation({ mutationFn: async (input: { project_id: string; title: string; description?: string; reason?: string; cost_impact: number; timeline_impact_days?: number }) => { const { error } = await supabase.from("project_change_orders").insert(input); if (error) throw error; await logProjectActivity(input.project_id, "change_order_created", `Change order "${input.title}" ($${input.cost_impact.toLocaleString()})`, user?.id); }, onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["project-change-orders", v.project_id] }); qc.invalidateQueries({ queryKey: ["project-activity-recent", v.project_id] }); qc.invalidateQueries({ queryKey: ["project-activity-log", v.project_id] }); } });
}

export function usePurchaseOrders(projectId: string) {
  return useQuery({ queryKey: ["project-purchase-orders", projectId], enabled: !!projectId, queryFn: async () => { const { data } = await supabase.from("project_purchase_orders").select("*").eq("project_id", projectId).order("created_at", { ascending: false }); return data || []; } });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient(); const { user } = useAuth();
  return useMutation({ mutationFn: async (input: { project_id: string; description: string; amount: number; po_number?: string; phase_id?: string }) => { const { error } = await supabase.from("project_purchase_orders").insert(input); if (error) throw error; await logProjectActivity(input.project_id, "po_created", `PO "${input.po_number || input.description}" ($${input.amount.toLocaleString()})`, user?.id); }, onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["project-purchase-orders", v.project_id] }); qc.invalidateQueries({ queryKey: ["project-activity-recent", v.project_id] }); qc.invalidateQueries({ queryKey: ["project-activity-log", v.project_id] }); } });
}

export function useProjectPermits(projectId: string) {
  return useQuery({ queryKey: ["project-permits", projectId], enabled: !!projectId, queryFn: async () => { const { data } = await supabase.from("project_permits").select("*").eq("project_id", projectId).order("created_at"); return data || []; } });
}

export function useCreatePermit() {
  const qc = useQueryClient(); const { user } = useAuth();
  return useMutation({ mutationFn: async (input: { project_id: string; permit_type: string; permit_number?: string; submitted_date?: string; status?: string }) => { const { error } = await supabase.from("project_permits").insert(input); if (error) throw error; await logProjectActivity(input.project_id, "permit_added", `Permit "${input.permit_type}" added`, user?.id); }, onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["project-permits", v.project_id] }); qc.invalidateQueries({ queryKey: ["project-activity-recent", v.project_id] }); } });
}

export function useProjectInspections(projectId: string) {
  return useQuery({ queryKey: ["project-inspections", projectId], enabled: !!projectId, queryFn: async () => { const { data } = await supabase.from("project_inspections").select("*").eq("project_id", projectId).order("scheduled_date"); return data || []; } });
}

export function useCreateInspection() {
  const qc = useQueryClient(); const { user } = useAuth();
  return useMutation({ mutationFn: async (input: { project_id: string; inspection_type: string; scheduled_date?: string; inspector_name?: string }) => { const { error } = await supabase.from("project_inspections").insert(input); if (error) throw error; await logProjectActivity(input.project_id, "inspection_added", `Inspection "${input.inspection_type}" scheduled`, user?.id); }, onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["project-inspections", v.project_id] }); qc.invalidateQueries({ queryKey: ["project-activity-recent", v.project_id] }); } });
}

export function useProjectDailyLogs(projectId: string) {
  return useQuery({ queryKey: ["project-daily-logs", projectId], enabled: !!projectId, queryFn: async () => { const { data } = await supabase.from("project_daily_logs").select("*").eq("project_id", projectId).order("log_date", { ascending: false }); return data || []; } });
}

export function useProjectDecisions(projectId: string) {
  return useQuery({ queryKey: ["project-decisions", projectId], enabled: !!projectId, queryFn: async () => { const { data } = await supabase.from("project_decisions").select("*").eq("project_id", projectId).order("decided_at", { ascending: false }); return data || []; } });
}

export function useProjectMessages(projectId: string) {
  return useQuery({ queryKey: ["project-messages", projectId], enabled: !!projectId, queryFn: async () => { const { data } = await supabase.from("project_messages").select("*").eq("project_id", projectId).order("created_at", { ascending: true }); return data || []; } });
}

export function useProjectFiles(projectId: string) {
  return useQuery({ queryKey: ["project-files", projectId], enabled: !!projectId, queryFn: async () => { const { data } = await supabase.from("project_files").select("*").eq("project_id", projectId).order("created_at", { ascending: false }); return data || []; } });
}

export function useProjectActivityLog(projectId: string) {
  return useQuery({ queryKey: ["project-activity-log", projectId], enabled: !!projectId, queryFn: async () => { const { data } = await supabase.from("project_activity_log").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(100); return data || []; } });
}

export function useUpdateProjectStatus() {
  const qc = useQueryClient(); const { user } = useAuth();
  return useMutation({ mutationFn: async ({ projectId, status, title }: { projectId: string; status: string; title: string }) => { const { error } = await supabase.from("projects").update({ status }).eq("id", projectId); if (error) throw error; await logProjectActivity(projectId, "status_changed", `Project "${title}" status → ${status.replace("_", " ")}`, user?.id); }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-projects"] }); qc.invalidateQueries({ queryKey: ["project-detail"] }); } });
}
