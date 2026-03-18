import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TimeEntry {
  id: string;
  admin_id: string;
  client_id: string;
  entry_date: string;
  hours: number;
  activity_type: string;
  notes: string | null;
  created_at: string;
}

export const ACTIVITY_TYPES = [
  { value: "site_visit", label: "Site Visit" },
  { value: "report_writing", label: "Report Writing" },
  { value: "vendor_coordination", label: "Vendor Coordination" },
  { value: "client_call", label: "Client Call" },
  { value: "admin", label: "Admin" },
  { value: "other", label: "Other" },
];

export function useTimeEntries(clientId?: string) {
  return useQuery({
    queryKey: ["time-entries", clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<TimeEntry[]> => {
      const { data, error } = await (supabase.from("time_entries") as any)
        .select("*")
        .eq("client_id", clientId!)
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useWeeklyTimeEntries() {
  return useQuery({
    queryKey: ["time-entries-weekly"],
    queryFn: async () => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data, error } = await (supabase.from("time_entries") as any)
        .select("*, properties(id, property_name, address)")
        .gte("entry_date", startOfWeek.toISOString().split("T")[0]);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: { client_id: string; entry_date: string; hours: number; activity_type: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await (supabase.from("time_entries") as any).insert({
        admin_id: user.id,
        client_id: entry.client_id,
        entry_date: entry.entry_date,
        hours: entry.hours,
        activity_type: entry.activity_type,
        notes: entry.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["time-entries", vars.client_id] });
      qc.invalidateQueries({ queryKey: ["time-entries-weekly"] });
    },
  });
}
