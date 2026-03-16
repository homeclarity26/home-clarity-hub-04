import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, Pencil, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  sort_order: number;
}

interface AdminProjectsSectionProps {
  propertyId: string;
  projects: Array<{
    id: string;
    title: string;
    description?: string | null;
    status: string;
    approved_tier: string | null;
    notes: string | null;
    estimated_start_date?: string | null;
    estimated_cost?: number | null;
    contractor_name?: string | null;
    contractor_contact?: string | null;
    created_at: string;
    report_page_id?: string | null;
  }> | undefined;
  reportPages?: Array<{ id: string; title: string; page_key: string }>;
}

const defaultForm = {
  title: "", description: "", status: "planned", notes: "", approved_tier: "",
  estimated_start_date: "", estimated_cost: "", contractor_name: "", contractor_contact: "",
  report_page_id: "",
};

const AdminProjectsSection = ({ propertyId, projects, reportPages }: AdminProjectsSectionProps) => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newMilestones, setNewMilestones] = useState<Record<string, { title: string; due_date: string }>>({});

  const resetForm = () => setForm(defaultForm);

  // Load milestones for all projects
  useEffect(() => {
    if (!projects || projects.length === 0) return;
    const ids = projects.map((p) => p.id);
    supabase.from("milestones").select("*").in("project_id", ids).order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) { toast.error("Failed to load milestones"); return; }
        const grouped: Record<string, Milestone[]> = {};
        (data || []).forEach((m: Milestone) => {
          if (!grouped[m.project_id]) grouped[m.project_id] = [];
          grouped[m.project_id].push(m);
        });
        setMilestones(grouped);
      });
  }, [projects]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-projects", propertyId] });

  const createProject = async () => {
    if (!form.title) return;
    const { error } = await supabase.from("projects").insert({
      property_id: propertyId,
      title: form.title,
      description: form.description || null,
      status: form.status,
      notes: form.notes || null,
      approved_tier: form.approved_tier || null,
      estimated_start_date: form.estimated_start_date || null,
      estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : null,
      contractor_name: form.contractor_name || null,
      contractor_contact: form.contractor_contact || null,
      report_page_id: form.report_page_id || null,
    });
    if (error) { toast.error("Failed to create project"); return; }
    toast.success("Project created");
    setCreateOpen(false);
    resetForm();
    invalidate();
  };

  const updateProject = async () => {
    if (!editId || !form.title) return;
    const { error } = await supabase.from("projects").update({
      title: form.title,
      description: form.description || null,
      status: form.status,
      notes: form.notes || null,
      approved_tier: form.approved_tier || null,
      estimated_start_date: form.estimated_start_date || null,
      estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : null,
      contractor_name: form.contractor_name || null,
      contractor_contact: form.contractor_contact || null,
      report_page_id: form.report_page_id || null,
    }).eq("id", editId);
    if (error) { toast.error("Failed to update project"); return; }
    toast.success("Project updated");
    setEditOpen(false);
    resetForm();
    setEditId(null);
    invalidate();
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Project deleted");
    invalidate();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("projects").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    invalidate();
  };

  const openEdit = (p: NonNullable<typeof projects>[0]) => {
    setEditId(p.id);
    setForm({
      title: p.title,
      description: p.description || "",
      status: p.status,
      notes: p.notes || "",
      approved_tier: p.approved_tier || "",
      estimated_start_date: p.estimated_start_date || "",
      estimated_cost: p.estimated_cost != null ? String(p.estimated_cost) : "",
      contractor_name: p.contractor_name || "",
      contractor_contact: p.contractor_contact || "",
      report_page_id: p.report_page_id || "",
    });
    setEditOpen(true);
  };

  const getMilestoneInput = (projectId: string) => newMilestones[projectId] ?? { title: "", due_date: "" };
  const setMilestoneInput = (projectId: string, patch: Partial<{ title: string; due_date: string }>) =>
    setNewMilestones((prev) => ({ ...prev, [projectId]: { ...getMilestoneInput(projectId), ...patch } }));

  // Milestone CRUD
  const addMilestone = async (projectId: string) => {
    const input = getMilestoneInput(projectId);
    if (!input.title) return;
    const order = (milestones[projectId]?.length || 0);
    const { data, error } = await supabase.from("milestones").insert({
      project_id: projectId,
      title: input.title,
      due_date: input.due_date || null,
      sort_order: order,
    }).select().single();
    if (error) { toast.error("Failed to add milestone"); return; }
    setMilestones((prev) => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []), data as Milestone],
    }));
    setMilestoneInput(projectId, { title: "", due_date: "" });
  };

  const toggleMilestone = async (m: Milestone) => {
    const { error } = await supabase.from("milestones").update({ completed: !m.completed }).eq("id", m.id);
    if (error) { toast.error("Failed to update"); return; }
    setMilestones((prev) => {
      const updated = { ...prev };
      updated[m.project_id] = (updated[m.project_id] || []).map((x) => x.id === m.id ? { ...x, completed: !x.completed } : x);
      return updated;
    });
  };

  const deleteMilestone = async (m: Milestone) => {
    const { error } = await supabase.from("milestones").delete().eq("id", m.id);
    if (error) { toast.error("Failed to delete"); return; }
    setMilestones((prev) => {
      const updated = { ...prev };
      updated[m.project_id] = (updated[m.project_id] || []).filter((x) => x.id !== m.id);
      return updated;
    });
  };

  const FormFields = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      <div><Label className="font-sans">Project Name</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div><Label className="font-sans">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="font-sans">Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label className="font-sans">Approved Tier</Label><Input value={form.approved_tier} onChange={(e) => setForm({ ...form, approved_tier: e.target.value })} placeholder="e.g. Enhanced" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="font-sans">Est. Start Date</Label><Input type="date" value={form.estimated_start_date} onChange={(e) => setForm({ ...form, estimated_start_date: e.target.value })} /></div>
        <div><Label className="font-sans">Est. Cost ($)</Label><Input type="number" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} /></div>
      </div>
      {reportPages && reportPages.length > 0 && (
        <div><Label className="font-sans">Linked Report Page</Label>
          <Select value={form.report_page_id} onValueChange={(v) => setForm({ ...form, report_page_id: v })}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {reportPages.map((rp) => (
                <SelectItem key={rp.id} value={rp.id}>{rp.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="font-sans">Contractor Name</Label><Input value={form.contractor_name} onChange={(e) => setForm({ ...form, contractor_name: e.target.value })} /></div>
        <div><Label className="font-sans">Contractor Contact</Label><Input value={form.contractor_contact} onChange={(e) => setForm({ ...form, contractor_contact: e.target.value })} placeholder="Phone or email" /></div>
      </div>
      <div><Label className="font-sans">Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-sans font-semibold text-foreground">Projects</h3>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5 text-xs font-sans"><Plus className="w-3.5 h-3.5" />Add Project</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-sans">Create Project</DialogTitle></DialogHeader>
            <FormFields />
            <Button onClick={createProject} className="w-full font-sans">Create</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { resetForm(); setEditId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-sans">Edit Project</DialogTitle></DialogHeader>
          <FormFields />
          <Button onClick={updateProject} className="w-full font-sans">Save Changes</Button>
        </DialogContent>
      </Dialog>

      {projects && projects.length > 0 ? (
        <div className="space-y-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-sans text-xs">Project</TableHead>
                <TableHead className="font-sans text-xs">Status</TableHead>
                <TableHead className="font-sans text-xs">Start Date</TableHead>
                <TableHead className="font-sans text-xs">Cost</TableHead>
                <TableHead className="font-sans text-xs">Contractor</TableHead>
                <TableHead className="font-sans text-xs w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => {
                const ms = milestones[project.id] || [];
                const isExpanded = expandedId === project.id;
                return (
                  <>
                    <TableRow key={project.id} className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : project.id)}>
                      <TableCell className="font-sans text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          {project.title}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select value={project.status} onValueChange={(v) => updateStatus(project.id, v)}>
                          <SelectTrigger className="h-7 w-[120px] text-[11px] font-sans"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planned">Planned</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground">
                        {project.estimated_start_date ? format(new Date(project.estimated_start_date), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground">
                        {project.estimated_cost != null ? `$${Number(project.estimated_cost).toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground">{project.contractor_name || "—"}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(project)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="sm"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-sans">Delete project?</AlertDialogTitle>
                                <AlertDialogDescription className="font-sans">This will permanently delete "{project.title}" and all its milestones.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="font-sans">Cancel</AlertDialogCancel>
                                <AlertDialogAction className="font-sans bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteProject(project.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${project.id}-ms`}>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          <div className="space-y-3">
                            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Milestones</p>
                            {ms.map((m) => (
                              <div key={m.id} className="flex items-center gap-3">
                                <Checkbox checked={m.completed} onCheckedChange={() => toggleMilestone(m)} />
                                <span className={`font-sans text-sm flex-1 ${m.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{m.title}</span>
                                {m.due_date && <span className="font-sans text-xs text-muted-foreground">{format(new Date(m.due_date), "MMM d")}</span>}
                                <Button variant="ghost" size="sm" onClick={() => deleteMilestone(m)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                              </div>
                            ))}
                            <div className="flex items-center gap-2 pt-1">
                              <Input
                                placeholder="Milestone name"
                                value={getMilestoneInput(project.id).title}
                                onChange={(e) => setMilestoneInput(project.id, { title: e.target.value })}
                                className="h-8 text-sm flex-1"
                                onKeyDown={(e) => { if (e.key === "Enter") addMilestone(project.id); }}
                              />
                              <Input
                                type="date"
                                value={getMilestoneInput(project.id).due_date}
                                onChange={(e) => setMilestoneInput(project.id, { due_date: e.target.value })}
                                className="h-8 text-sm w-[140px]"
                              />
                              <Button size="sm" variant="outline" className="h-8 text-xs font-sans" onClick={() => addMilestone(project.id)}>
                                <Plus className="w-3 h-3 mr-1" />Add
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card className="p-8 text-center"><p className="text-sm font-sans text-muted-foreground">No projects yet. Create one to track client work.</p></Card>
      )}
    </div>
  );
};

export default AdminProjectsSection;
