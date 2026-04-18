import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminTask {
  id: string;
  admin_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  // joined
  client_name?: string;
  client_address?: string;
}

export function useAdminTasks(clientId?: string) {
  return useQuery({
    queryKey: ["admin-tasks", clientId],
    queryFn: async (): Promise<AdminTask[]> => {
      let query = supabase.from("tasks")
        .select("*, properties(id, property_name, address)")
        .order("due_date", { ascending: true, nullsFirst: false });

      if (clientId) query = query.eq("client_id", clientId);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        client_name: t.properties?.property_name || t.properties?.address || null,
        client_address: t.properties?.address || null,
      }));
    },
  });
}

export function useOpenTaskCount() {
  return useQuery({
    queryKey: ["admin-task-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("tasks")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]);
      if (error) return 0;
      return count || 0;
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: { title: string; description?: string; due_date?: string; priority?: string; client_id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("tasks").insert({
        admin_id: user.id,
        title: task.title,
        description: task.description || null,
        due_date: task.due_date || null,
        priority: task.priority || "medium",
        client_id: task.client_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tasks"] });
      qc.invalidateQueries({ queryKey: ["admin-task-count"] });
    },
  });
}

export function useToggleTaskComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "completed" ? "open" : "completed";
      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tasks"] });
      qc.invalidateQueries({ queryKey: ["admin-task-count"] });
    },
  });
}
