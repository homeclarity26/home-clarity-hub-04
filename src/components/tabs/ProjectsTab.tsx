import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { ReportPageData } from "@/data/reportContent";

interface ProjectsTabProps {
  onNavigate: (tab: string) => void;
  propertyId?: string;
  pages?: Record<string, ReportPageData>;
}

interface Project {
  id: string;
  title: string;
  status: string;
  approved_tier: string | null;
  notes: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  planned: "bg-muted text-muted-foreground",
  approved: "bg-accent/20 text-accent-foreground",
  in_progress: "bg-primary/10 text-foreground",
  complete: "bg-foreground text-background",
};

const ProjectsTab = ({ onNavigate, propertyId, pages }: ProjectsTabProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) {
      setLoading(false);
      return;
    }
    supabase
      .from("projects")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setProjects(data as Project[]);
        setLoading(false);
      });
  }, [propertyId]);

  // Build upcoming considerations from report pages that have timing
  const upcoming = pages
    ? Object.entries(pages)
        .filter(([, p]) => p.timing)
        .map(([key, p]) => ({ key, title: p.title, timing: p.timing! }))
    : [];

  const activeProjects = projects.filter((p) => p.status !== "complete");
  const completedProjects = projects.filter((p) => p.status === "complete");

  return (
    <div>
      <div className="py-16 md:py-24 px-6 md:px-20 max-w-[1400px] mx-auto">
        <h1 className="font-display text-3xl text-foreground mb-6">Project Management</h1>
        <p className="text-base text-muted-foreground max-w-[60ch]">
          Track active and planned home improvement projects based on your Home Clarity Report recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 max-w-[1400px] mx-auto px-6 md:px-20 pb-16">
        {/* Active Projects */}
        <Card className="md:col-span-2 p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-6">
            {activeProjects.length > 0 ? "Active Projects" : "No Active Projects"}
          </h2>
          {activeProjects.length > 0 ? (
            <div className="flex flex-col gap-4">
              {activeProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between py-4 border-b border-border last:border-b-0">
                  <div>
                    <p className="text-base text-foreground font-medium">{project.title}</p>
                    {project.approved_tier && (
                      <p className="font-mono text-[11px] text-muted-foreground mt-1">Tier: {project.approved_tier}</p>
                    )}
                    {project.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{project.notes}</p>
                    )}
                  </div>
                  <Badge className={`${statusColors[project.status] || statusColors.planned} text-xs font-mono uppercase border-none`}>
                    {project.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="text-base text-foreground mb-6">
                Your project dashboard awaits its first milestone. Once you approve work from your
                Home Clarity Report, this space will display project timelines and progress tracking.
              </p>
              <button
                onClick={() => onNavigate("report")}
                className="font-mono text-[11px] text-foreground bg-transparent border-none underline cursor-pointer"
              >
                Review Report Recommendations
              </button>
            </>
          )}
        </Card>

        {/* Upcoming Considerations */}
        <Card className="p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-6">Upcoming Considerations</h2>
          {upcoming.length > 0 ? (
            <div className="flex flex-col gap-4">
              {upcoming.map((item) => (
                <button
                  key={item.key}
                  onClick={() => onNavigate("report")}
                  className="py-3 border-b border-border font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground hover:pl-3 transition-all cursor-pointer bg-transparent border-none text-left w-full"
                >
                  {item.title} ({item.timing})
                </button>
              ))}
            </div>
          ) : (
            <p className="text-base text-foreground">
              Recommendations will appear here once your report is complete.
            </p>
          )}
        </Card>

        {/* Project Archive */}
        <Card className="p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-6">Project Archive</h2>
          {completedProjects.length > 0 ? (
            <div className="flex flex-col gap-4">
              {completedProjects.map((project) => (
                <div key={project.id} className="py-3 border-b border-border last:border-b-0">
                  <p className="text-sm text-foreground">{project.title}</p>
                  <p className="font-mono text-[11px] text-muted-foreground mt-1">
                    Completed {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No completed projects yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProjectsTab;
