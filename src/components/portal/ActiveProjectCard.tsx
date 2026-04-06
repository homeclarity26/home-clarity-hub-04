import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Loader2, FolderOpen } from "lucide-react";
import { format } from "date-fns";

interface Project {
  id: string;
  title: string;
  status: string;
  phase?: string | null;
  progress_percent?: number | null;
  updated_at: string;
  property_id: string;
  total_cost?: number | null;
  milestones_completed?: number | null;
  milestones_total?: number | null;
}

interface ActiveProjectCardProps {
  propertyId: string;
  onNavigate: (tab: string) => void;
}

const statusLabel: Record<string, string> = {
  active: "Active",
  in_progress: "In Progress",
  planning: "Planning",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusColor: Record<string, string> = {
  active: "text-accent bg-accent/10",
  in_progress: "text-accent bg-accent/10",
  planning: "text-primary/80 bg-primary/10",
  on_hold: "text-muted-foreground bg-muted",
  completed: "text-green-700 bg-green-100",
  cancelled: "text-destructive bg-destructive/10",
};

const ActiveProjectCard = ({ propertyId, onNavigate }: ActiveProjectCardProps) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = async () => {
    const { data, error } = await (supabase.from("projects" as any) as any)
      .select("*")
      .eq("property_id", propertyId)
      .in("status", ["active", "in_progress", "planning"])
      .order("updated_at", { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      setProject(data[0]);
    } else {
      setProject(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) {
      setLoading(false);
      return;
    }
    fetchProject();

    // Real-time subscription
    const channel = supabase
      .channel("project-updates")
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
          filter: `property_id=eq.${propertyId}`,
        },
        (payload: any) => {
          if (payload.new) {
            setProject(payload.new as Project);
          }
        }
      )
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "projects",
          filter: `property_id=eq.${propertyId}`,
        },
        () => {
          fetchProject();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyId]);

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-hbc-sm p-6 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm font-sans text-muted-foreground">Loading project...</span>
      </div>
    );
  }

  if (!project) return null;

  const progress =
    project.progress_percent != null
      ? project.progress_percent
      : project.milestones_completed != null && project.milestones_total
      ? Math.round((project.milestones_completed / project.milestones_total) * 100)
      : 0;

  const statusKey = project.status || "active";
  const badgeClass = statusColor[statusKey] || "text-muted-foreground bg-muted";
  const label = statusLabel[statusKey] || project.status;
  const phase = project.phase || label;

  const updatedAt = project.updated_at
    ? format(new Date(project.updated_at), "MMM d, yyyy")
    : null;

  return (
    <div className="bg-card rounded-lg border border-border shadow-hbc-sm p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <FolderOpen className="w-4 h-4 text-accent shrink-0" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
            Active Project
          </span>
        </div>
        {updatedAt && (
          <span className="font-mono text-[10px] text-muted-foreground">
            Updated {updatedAt}
          </span>
        )}
      </div>

      {/* Project title */}
      <h3 className="font-display text-xl text-foreground mb-3 leading-snug">
        {project.title}
      </h3>

      {/* Phase badge */}
      <div className="mb-4">
        <span
          className={`inline-block font-mono text-[10px] uppercase tracking-[0.15em] px-2.5 py-1 rounded-full ${badgeClass}`}
        >
          {phase}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-1.5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-mono text-[11px] text-muted-foreground">Progress</span>
          <span className="font-mono text-[11px] text-foreground font-medium">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => onNavigate("projects")}
        className="mt-5 w-full flex items-center justify-center gap-2 font-sans text-sm font-medium text-accent border border-accent/30 rounded-md px-4 py-2.5 hover:bg-accent/10 hover:border-accent/60 transition-all"
      >
        View Project
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ActiveProjectCard;
