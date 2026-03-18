import { useState, useEffect } from "react";
import { Hammer, Archive, Wrench, FileText, Phone, ChevronRight, ChevronDown, CheckCircle, Calendar, DollarSign, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { ReportPageData } from "@/data/reportContent";

interface ProjectsTabProps {
  onNavigate: (tab: string) => void;
  onTabChange?: (tab: string) => void;
  propertyId?: string;
  pages?: Record<string, ReportPageData>;
  onSendMessage?: (msg: string) => void;
}

interface Milestone {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  sort_order: number;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  approved_tier: string | null;
  notes: string | null;
  estimated_start_date: string | null;
  estimated_cost: number | null;
  contractor_name: string | null;
  contractor_contact: string | null;
  created_at: string;
  report_page_id: string | null;
}

const cardBase = "bg-card rounded-lg shadow-hbc-sm border border-border";

const statusConfig: Record<string, { label: string; cls: string }> = {
  planned: { label: "Planned", cls: "bg-muted text-muted-foreground" },
  approved: { label: "Approved", cls: "bg-accent/20 text-accent-foreground" },
  in_progress: { label: "In Progress", cls: "bg-primary/15 text-primary" },
  complete: { label: "Complete", cls: "bg-accent/20 text-accent" },
};

const getUrgencyBadge = (timing: string) => {
  const t = timing.toLowerCase();
  if (t.includes("immediate") || t === "year 1" || t.includes("before")) {
    return { label: "URGENT", cls: "bg-destructive/10 text-destructive" };
  }
  if (t.includes("year 1") || t.includes("year 2") || t.includes("1–2") || t.includes("2–3")) {
    return { label: "SOON", cls: "bg-accent/20 text-accent-foreground" };
  }
  return { label: "FUTURE", cls: "bg-muted text-muted-foreground" };
};

const ProjectsTab = ({ onNavigate, onTabChange, propertyId, pages, onSendMessage }: ProjectsTabProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const loadData = async () => {
    if (!propertyId) { setLoading(false); return; }

    // Demo data for dev bypass
    if (propertyId.startsWith("mock-")) {
      setProjects([
        { id: "proj-1", title: "Furnace Replacement", description: "Replace aging primary furnace before next heating season. Current unit is 2008 model showing signs of failure.", status: "approved", approved_tier: "Enhanced", notes: "Three vendor bids received. Preferred vendor: Comfort First HVAC.", estimated_start_date: "2026-05-01", estimated_cost: 8500, contractor_name: "Comfort First HVAC", contractor_contact: "(330) 555-0200", created_at: "2026-03-01T00:00:00Z", report_page_id: null },
        { id: "proj-2", title: "Electrical Panel Upgrade", description: "Upgrade from 100A to 200A service to support modern loads and future improvements.", status: "planned", approved_tier: null, notes: null, estimated_start_date: "2026-08-01", estimated_cost: 4500, contractor_name: null, contractor_contact: null, created_at: "2026-03-05T00:00:00Z", report_page_id: null },
      ]);
      setMilestones({
        "proj-1": [
          { id: "ms-1", title: "Select vendor & sign contract", due_date: "2026-04-01", completed: true, sort_order: 1 },
          { id: "ms-2", title: "Equipment ordered & delivery confirmed", due_date: "2026-04-15", completed: true, sort_order: 2 },
          { id: "ms-3", title: "Installation scheduled", due_date: "2026-05-01", completed: false, sort_order: 3 },
          { id: "ms-4", title: "Final inspection & warranty registration", due_date: "2026-05-07", completed: false, sort_order: 4 },
        ],
      });
      setLoading(false);
      return;
    }

    const { data: projData } = await supabase
      .from("projects")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    const projs = (projData || []) as Project[];
    setProjects(projs);

    if (projs.length > 0) {
      const ids = projs.map((p) => p.id);
      const { data: msData } = await supabase
        .from("milestones")
        .select("*")
        .in("project_id", ids)
        .order("sort_order", { ascending: true });

      const grouped: Record<string, Milestone[]> = {};
      (msData || []).forEach((m: Milestone & { project_id: string }) => {
        if (!grouped[m.project_id]) grouped[m.project_id] = [];
        grouped[m.project_id].push(m);
      });
      setMilestones(grouped);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [propertyId]);

  const toggleMilestone = async (milestone: Milestone) => {
    const newVal = !milestone.completed;
    const { error } = await supabase.from("milestones").update({ completed: newVal }).eq("id", milestone.id);
    if (error) { toast.error("Failed to update milestone"); return; }
    setMilestones((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        updated[key] = updated[key].map((m) => m.id === milestone.id ? { ...m, completed: newVal } : m);
      }
      return updated;
    });
  };

  const activeProjects = projects.filter((p) => p.status !== "complete");
  const completedProjects = projects.filter((p) => p.status === "complete");

  const upcoming = pages
    ? Object.entries(pages).filter(([, p]) => p.timing).map(([key, p]) => ({ key, title: p.title, timing: p.timing! }))
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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

        {/* Active Projects */}
        {activeProjects.length > 0 && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Active Projects</p>
            <div className="grid grid-cols-1 gap-4">
              {activeProjects.map((project) => {
                const badge = statusConfig[project.status] || statusConfig.planned;
                const ms = milestones[project.id] || [];
                const completedCount = ms.filter((m) => m.completed).length;
                const isExpanded = expandedId === project.id;

                return (
                  <Collapsible key={project.id} open={isExpanded} onOpenChange={(o) => setExpandedId(o ? project.id : null)}>
                    <div className={`${cardBase} overflow-hidden`}>
                      <CollapsibleTrigger className="w-full text-left p-6 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <Hammer className="w-5 h-5 text-accent shrink-0" />
                              <h3 className="font-display text-xl text-foreground truncate">{project.title}</h3>
                              <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                                {badge.label}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-sans ml-8">
                              {project.estimated_start_date && (
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {new Date(project.estimated_start_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                </span>
                              )}
                              {project.estimated_cost != null && (
                                <span className="flex items-center gap-1.5">
                                  <DollarSign className="w-3.5 h-3.5" />
                                  ${Number(project.estimated_cost).toLocaleString()}
                                </span>
                              )}
                              {project.contractor_name && (
                                <span className="flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5" />
                                  {project.contractor_name}
                                </span>
                              )}
                              {ms.length > 0 && (
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  {completedCount}/{ms.length} milestones
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="border-t border-border px-6 py-5 space-y-5">
                          {/* Milestones */}
                          {ms.length > 0 && (
                            <div>
                              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">Milestones</p>
                              <div className="space-y-2">
                                {ms.map((m) => (
                                  <label key={m.id} className="flex items-center gap-3 py-1.5 cursor-pointer group">
                                    <Checkbox
                                      checked={m.completed}
                                      onCheckedChange={() => toggleMilestone(m)}
                                    />
                                    <span className={`font-sans text-sm flex-1 ${m.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                      {m.title}
                                    </span>
                                    {m.due_date && (
                                      <span className="font-sans text-xs text-muted-foreground">
                                        {new Date(m.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                      </span>
                                    )}
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {project.notes && (
                            <div>
                              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">Notes</p>
                              <p className="font-sans text-sm text-muted-foreground">{project.notes}</p>
                            </div>
                          )}

                          {/* Description */}
                          {project.description && (
                            <div>
                              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">Description</p>
                              <p className="font-sans text-sm text-muted-foreground">{project.description}</p>
                            </div>
                          )}

                          {/* Contractor */}
                          {project.contractor_name && (
                            <div>
                              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">Contractor</p>
                              <p className="font-sans text-sm text-foreground">{project.contractor_name}</p>
                              {project.contractor_contact && (
                                <p className="font-sans text-xs text-muted-foreground mt-0.5">{project.contractor_contact}</p>
                              )}
                            </div>
                          )}

                          {/* Approved Tier */}
                          {project.approved_tier && (
                            <div className="flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-accent" />
                              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">{project.approved_tier} tier approved</span>
                            </div>
                          )}

                          {/* Ask About This Project */}
                          {project.status !== "complete" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-xs font-sans mt-2 w-fit"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSendMessage?.(`I have a question about my ${project.title} project.`);
                              }}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Ask About This Project
                            </Button>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {projects.length === 0 && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Project Status</p>
            <div className={`${cardBase} p-8`}>
              <Hammer className="w-5 h-5 text-accent mb-3" />
              <h2 className="font-display text-xl text-foreground mb-1">No Active Projects</h2>
              <p className="font-sans text-sm text-muted-foreground">Projects will appear here once your advisor creates them from the report.</p>
            </div>
          </div>
        )}

        {/* Project Archive */}
        {completedProjects.length > 0 && (
          <div>
            <Collapsible open={archiveOpen} onOpenChange={setArchiveOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer mb-4">
                <Archive className="w-4 h-4 text-muted-foreground" />
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Project Archive ({completedProjects.length})
                </p>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${archiveOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-3">
                    {completedProjects.map((project) => (
                      <div key={project.id} className={`${cardBase} p-5 opacity-70`}>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display text-base text-foreground truncate">{project.title}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              {project.approved_tier && (
                                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{project.approved_tier} tier</span>
                              )}
                              {project.estimated_cost != null && (
                                <span className="font-sans text-xs text-muted-foreground">${Number(project.estimated_cost).toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Upcoming Considerations */}
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
                    className={`${cardBase} group p-6 text-left hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200`}
                  >
                    <div className="flex items-start justify-between w-full mb-3">
                      <Wrench className="w-5 h-5 text-accent" />
                      <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <h3 className="font-display text-xl text-foreground mb-1">{item.title}</h3>
                    <p className="font-sans text-sm text-muted-foreground">{item.timing}</p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors mt-2" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button onClick={() => { if (onTabChange) onTabChange("report"); else onNavigate("report"); }} className={`${cardBase} group p-6 text-left hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200`}>
              <FileText className="w-5 h-5 text-accent mb-3" />
              <h2 className="font-display text-xl text-foreground mb-1">Review Report Recommendations</h2>
              <p className="font-sans text-sm text-muted-foreground">See what your Home Clarity Report recommends</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors mt-2" />
            </button>
            <button onClick={() => { if (onTabChange) onTabChange("contacts"); else onNavigate("contacts"); }} className={`${cardBase} group p-6 text-left hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200`}>
              <Phone className="w-5 h-5 text-accent mb-3" />
              <h2 className="font-display text-xl text-foreground mb-1">Contact Your Advisor</h2>
              <p className="font-sans text-sm text-muted-foreground">Adam Kilgore — Founder & Lead Advisor</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors mt-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsTab;
