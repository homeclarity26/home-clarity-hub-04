import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, History, Loader2 } from "lucide-react";
import { useKnowledgeTemplates } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type TabType = "pricing" | "scope" | "systems";

interface TemplateForm {
  title: string;
  content: string;
  region: string;
}

const KnowledgeBase = () => {
  const [activeTab, setActiveTab] = useState<TabType>("pricing");
  const { data: templates, isLoading } = useKnowledgeTemplates(activeTab);
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<TemplateForm>({ title: "", content: "{}", region: "" });

  const createTemplate = async () => {
    if (!form.title) return;
    let parsedContent: Record<string, unknown> = {};
    try { parsedContent = JSON.parse(form.content); } catch { toast.error("Invalid JSON content"); return; }
    const { error } = await supabase.from("knowledge_templates").insert({
      category: activeTab,
      title: form.title,
      content: parsedContent,
      region: form.region || null,
    });
    if (error) { toast.error("Failed to create template"); return; }
    toast.success("Template created");
    setCreateOpen(false);
    setForm({ title: "", content: "{}", region: "" });
    queryClient.invalidateQueries({ queryKey: ["knowledge-templates"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-border">
        {(["pricing", "scope", "systems"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-sans capitalize transition-colors border-b-2 bg-transparent cursor-pointer ${
              activeTab === tab
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "pricing" ? "Pricing Templates" : tab === "scope" ? "Scope Templates" : "System Templates"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-sans text-muted-foreground">
            {activeTab === "pricing" ? "Manage three-tier pricing for project types" :
             activeTab === "scope" ? "Template narratives for each room/system type" :
             "Equipment templates with lifespans, maintenance, and costs"}
          </p>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs font-sans">
                <Plus className="w-3.5 h-3.5" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-sans">New {activeTab} template</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label className="font-sans">Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label className="font-sans">Content (JSON)</Label><Textarea rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="font-mono text-xs" /></div>
                <div><Label className="font-sans">Region</Label><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="e.g. Summit County, OH" /></div>
                <Button onClick={createTemplate} className="w-full font-sans">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : templates && templates.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-sans text-xs">Title</TableHead>
                <TableHead className="font-sans text-xs">Region</TableHead>
                <TableHead className="font-sans text-xs">Ver.</TableHead>
                <TableHead className="font-sans text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-sans text-sm font-medium">{template.title}</TableCell>
                  <TableCell className="font-sans text-xs text-muted-foreground">{template.region || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-sans">v{template.version}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm"><Edit className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm"><History className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-sm font-sans text-muted-foreground">No {activeTab} templates yet. Add one to get started.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
