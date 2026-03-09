import { useState, useEffect } from "react";
import { Hammer, Archive, Wrench, FileText, Phone, ChevronRight, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
  report_page_id: string | null;
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

const tierOptions = ["Essential", "Enhanced", "Signature"];

const ProjectsTab = ({ onNavigate, onTabChange, propertyId, pages }: ProjectsTabProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);

  const loadProjects = () => {
    if (!propertyId) { setLoading(false); return; }
    supabase.from("projects").select("*").eq("property_id", propertyId).order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setProjects(data as Project[]); setLoading(false); });
  };

  useEffect(() => { loadProjects(); }, [propertyId]);

  const approveTier = async (tier: string) => {
    if (!selectedProject) return;
    const { error } = await supabase.from("projects").update({ approved_tier: tier, status: "approved" }).eq("id", selectedProject.id);
    if (error) { toast.error("Failed to approve tier"); return; }
    toast.success(`${tier} tier approved for ${selectedProject.title}`);
    setApprovalOpen(false);
    setSelectedProject(null);
    loadProjects();
  };

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

        {/* Active Projects with Approval */}
        {activeProjects.length > 0 && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Active Projects</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeProjects.map((project) => (
                <div key={project.id} className={`${cardBase} border-l-[3px] border-l-accent cursor-default`}>
                  <div className="flex items-start justify-between w-full">
                    <Hammer className="w-5 h-5 text-accent" />
                    <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      project.status === "approved" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                    }`}>
                      {project.status.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="font-display text-xl text-foreground">{project.title}</h3>
                  {project.approved_tier && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-accent" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">{project.approved_tier} tier approved</span>
                    </div>
                  )}
                  {project.notes && <p className="font-sans text-sm text-muted-foreground">{project.notes}</p>}
                  {project.status === "planned" && !project.approved_tier && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-sans text-xs mt-2 self-start"
                      onClick={() => { setSelectedProject(project); setApprovalOpen(true); }}
                    >
                      Select a Tier
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Projects */}
        {completedProjects.length > 0 && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Completed</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedProjects.map((project) => (
                <div key={project.id} className={`${cardBase} opacity-70 cursor-default`}>
                  <Archive className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-display text-xl text-foreground">{project.title}</h3>
                  {project.approved_tier && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{project.approved_tier} tier</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Status Cards (when no projects) */}
        {projects.length === 0 && !loading && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Project Status</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${cardBase} cursor-default`}>
                <Hammer className="w-5 h-5 text-accent" />
                <h2 className="font-display text-xl text-foreground mb-1">No Active Projects</h2>
                <p className="font-sans text-sm text-muted-foreground">Projects will appear here once your advisor creates them from the report.</p>
              </div>
            </div>
          </div>
        )}

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

      {/* Tier Approval Dialog */}
      <Dialog open={approvalOpen} onOpenChange={(o) => { setApprovalOpen(o); if (!o) setSelectedProject(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans">Select a Tier for {selectedProject?.title}</DialogTitle>
          </DialogHeader>
          <p className="font-sans text-sm text-muted-foreground">Choose the service tier you'd like to approve for this project.</p>
          <div className="grid grid-cols-1 gap-3 mt-2">
            {tierOptions.map((tier) => (
              <button
                key={tier}
                onClick={() => approveTier(tier)}
                className="w-full p-4 rounded-lg border border-border bg-card hover:border-accent hover:bg-accent/5 transition-all text-left"
              >
                <h4 className="font-display text-lg text-foreground">{tier}</h4>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mt-1">
                  {tier === "Essential" && "Core repairs and maintenance"}
                  {tier === "Enhanced" && "Recommended improvements included"}
                  {tier === "Signature" && "Premium upgrades and full scope"}
                </p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsTab;
