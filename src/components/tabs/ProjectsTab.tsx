import { useState, useEffect } from "react";
import { Hammer, Archive, Wrench, FileText, Phone, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ReportPageData } from "@/data/reportContent";

interface ProjectsTabProps {
  onNavigate: (tab: string) => void;
  onTabChange?: (tab: string) => void;
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

const cardBase = "group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full";

const getUrgencyBadge = (timing: string) => {
  const t = timing.toLowerCase();
  if (t.includes("immediate") || t === "year 1" || t.includes("before")) {
    return { label: "URGENT", cls: "bg-destructive/10 text-destructive" };
  }
  if (t.includes("year 1") || t.includes("year 2") || t.includes("1–2") || t.includes("2–3") || t.includes("drainage")) {
    return { label: "SOON", cls: "bg-accent/20 text-accent-foreground" };
  }
  return { label: "FUTURE", cls: "bg-muted text-muted-foreground" };
};

const ProjectsTab = ({ onNavigate, onTabChange, propertyId, pages }: ProjectsTabProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) { setLoading(false); return; }
    supabase.from("projects").select("*").eq("property_id", propertyId).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setProjects(data as Project[]); setLoading(false); });
  }, [propertyId]);

  const upcoming = pages
    ? Object.entries(pages).filter(([, p]) => p.timing).map(([key, p]) => ({ key, title: p.title, timing: p.timing! }))
    : [];

  const activeProjects = projects.filter((p) => p.status !== "complete");
  const completedProjects = projects.filter((p) => p.status === "complete");

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-12 md:py-16 px-6 md:px-20 max-w-4xl mx-auto">
        <h1 className="font-display text-3xl md:text-[36px] text-foreground mb-3">Project Management</h1>
        <p className="font-sans text-base text-muted-foreground">
          Track active and planned improvements from your Home Clarity Report.
        </p>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 md:px-20 pb-16 flex flex-col gap-10">

        {/* Row 1: Project Status */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Project Status</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => {}} className={`${cardBase} border-l-[3px] border-l-accent`}>
              <Hammer className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">Active Projects</h2>
              <p className="font-sans text-sm text-muted-foreground">Ongoing home improvement work</p>
              {activeProjects.length > 0 ? (
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent mt-1">
                  {activeProjects.length} active
                </span>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mt-1">
                  No active projects
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>

            <button onClick={() => {}} className={cardBase}>
              <Archive className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">Project Archive</h2>
              <p className="font-sans text-sm text-muted-foreground">Completed projects and finished milestones</p>
              {completedProjects.length > 0 ? (
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent mt-1">
                  {completedProjects.length} completed
                </span>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mt-1">
                  No completed projects yet
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>
          </div>
        </div>

        {/* Row 2: Upcoming Considerations */}
        {upcoming.length > 0 && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Upcoming Considerations</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((item) => {
                const badge = getUrgencyBadge(item.timing);
                return (
                  <button
                    key={item.key}
                    onClick={() => onNavigate("report")}
                    className={cardBase}
                  >
                    <div className="flex items-start justify-between w-full">
                      <Wrench className="w-5 h-5 text-accent" />
                      <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <h3 className="font-display text-xl text-foreground">{item.title}</h3>
                    <p className="font-sans text-sm text-muted-foreground">{item.timing}</p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Row 3: Quick Actions */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button onClick={() => { if (onTabChange) onTabChange("report"); else onNavigate("report"); }} className={cardBase}>
              <FileText className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">Review Report Recommendations</h2>
              <p className="font-sans text-sm text-muted-foreground">See what your Home Clarity Report recommends</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>
            <button onClick={() => { if (onTabChange) onTabChange("contacts"); else onNavigate("contacts"); }} className={cardBase}>
              <Phone className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl text-foreground mb-1">Contact Your Advisor</h2>
              <p className="font-sans text-sm text-muted-foreground">Adam Kinney — Founder & Lead Advisor</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsTab;
