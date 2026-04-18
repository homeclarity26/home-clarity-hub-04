import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TutorialProgress {
  id: string;
  user_id: string;
  checklist_items_json: Record<string, boolean>;
  onboarding_complete: boolean;
  completed_tours: string[];
  admin_setup_dismissed: boolean;
  admin_setup_items_json: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export const useTutorialProgress = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: progress, isLoading } = useQuery({
    queryKey: ["tutorial-progress", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tutorial_progress")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data as unknown as TutorialProgress | null;
    },
  });

  const ensureRecord = async () => {
    if (!user?.id) return null;
    const { data: existing } = await supabase
      .from("tutorial_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) return existing as unknown as TutorialProgress;

    const { data: created } = await supabase
      .from("tutorial_progress")
      .insert({ user_id: user.id } as any)
      .select()
      .single();

    return created as unknown as TutorialProgress;
  };

  const updateProgress = useMutation({
    mutationFn: async (updates: Partial<Pick<TutorialProgress, "checklist_items_json" | "onboarding_complete" | "completed_tours" | "admin_setup_dismissed" | "admin_setup_items_json">>) => {
      await ensureRecord();
      const { error } = await supabase
        .from("tutorial_progress")
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorial-progress", user?.id] });
    },
  });

  const markChecklistItem = async (key: string) => {
    const current = (progress?.checklist_items_json || {}) as Record<string, boolean>;
    if (current[key]) return;
    const updated = { ...current, [key]: true };
    await updateProgress.mutateAsync({ checklist_items_json: updated });
  };

  const markTourComplete = async (tourId: string) => {
    const tours = (progress?.completed_tours || []) as string[];
    if (tours.includes(tourId)) return;
    await updateProgress.mutateAsync({ completed_tours: [...tours, tourId] });
  };

  const markOnboardingComplete = async () => {
    await updateProgress.mutateAsync({ onboarding_complete: true });
  };

  const dismissAdminSetup = async () => {
    await updateProgress.mutateAsync({ admin_setup_dismissed: true });
  };

  const markAdminSetupItem = async (key: string) => {
    const current = (progress?.admin_setup_items_json || {}) as Record<string, boolean>;
    if (current[key]) return;
    const updated = { ...current, [key]: true };
    await updateProgress.mutateAsync({ admin_setup_items_json: updated });
  };

  const clientChecklistItems = [
    { key: "view_report", title: "View your Home Clarity Report", description: "Read through your full home assessment", tab: "report" },
    { key: "check_health", title: "Check your Home Health Score", description: "See how your home rates overall", tab: "home" },
    { key: "review_actions", title: "Review your Priority Action Items", description: "See what your advisor recommends first", tab: "report" },
    { key: "explore_projects", title: "Explore your Active Projects", description: "Track work in progress on your home", tab: "projects" },
    { key: "view_equipment", title: "View your Equipment Registry", description: "See every major system logged in your home", tab: "equipment" },
    { key: "view_document", title: "Upload or view a Document", description: "Access shared files and reports", tab: "documents" },
    { key: "send_message", title: "Send a message to your advisor", description: "Start a conversation with your HBC team", tab: "messages" },
    { key: "check_schedule", title: "Check your Schedule & Maintenance Calendar", description: "See upcoming events and seasonal tasks", tab: "schedule" },
  ];

  const completedCount = clientChecklistItems.filter(
    (item) => (progress?.checklist_items_json as Record<string, boolean>)?.[item.key]
  ).length;

  const allComplete = completedCount === clientChecklistItems.length;

  return {
    progress,
    isLoading,
    markChecklistItem,
    markTourComplete,
    markOnboardingComplete,
    dismissAdminSetup,
    markAdminSetupItem,
    clientChecklistItems,
    completedCount,
    allComplete,
    ensureRecord,
  };
};
