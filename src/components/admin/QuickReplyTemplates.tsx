import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Copy, Trash2, Search, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface QuickReplyTemplatesProps {
  onInsert?: (text: string) => void;
}

const QuickReplyTemplates = ({ onInsert }: QuickReplyTemplatesProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");

  const { data: templates = [] } = useQuery({
    queryKey: ["quick-reply-templates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("narrative_snippets")
        .select("*")
        .eq("category", "reply_template")
        .order("usage_count", { ascending: false });
      return data || [];
    },
  });

  const filtered = templates.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase())
  );

  const addTemplate = async () => {
    if (!newTitle.trim() || !newContent.trim() || !user) return;
    const { error } = await supabase.from("narrative_snippets").insert({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: "reply_template",
      created_by: user.id,
      tags: [newCategory],
    });
    if (error) { toast.error("Failed to save template"); return; }
    toast.success("Template saved");
    setAddOpen(false);
    setNewTitle("");
    setNewContent("");
    queryClient.invalidateQueries({ queryKey: ["quick-reply-templates"] });
  };

  const useTemplate = async (template: typeof templates[0]) => {
    if (onInsert) onInsert(template.content);
    else {
      navigator.clipboard.writeText(template.content);
      toast.success("Template copied to clipboard");
    }
    // Increment usage count
    await supabase
      .from("narrative_snippets")
      .update({ usage_count: template.usage_count + 1 })
      .eq("id", template.id);
    queryClient.invalidateQueries({ queryKey: ["quick-reply-templates"] });
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from("narrative_snippets").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Template deleted");
    queryClient.invalidateQueries({ queryKey: ["quick-reply-templates"] });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-sans font-semibold text-foreground">Reply Templates</h4>
          <Badge variant="secondary" className="text-[10px]">{templates.length}</Badge>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs font-sans gap-1">
              <Plus className="w-3 h-3" />Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-sans">New Reply Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Template name..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="font-sans" />
              <Textarea placeholder="Template content... Use {{client_name}} for variables" value={newContent} onChange={(e) => setNewContent(e.target.value)} className="font-sans min-h-[100px]" />
              <Button onClick={addTemplate} className="w-full font-sans">Save Template</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs font-sans"
        />
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs font-sans text-muted-foreground text-center py-4">
            {templates.length === 0 ? "No templates yet. Create one to get started." : "No matching templates."}
          </p>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="border border-border rounded-md p-2.5 group hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans font-medium text-foreground">{t.title}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => useTemplate(t)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => deleteTemplate(t.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="text-[11px] font-sans text-muted-foreground mt-1 line-clamp-2">{t.content}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-sans text-muted-foreground">Used {t.usage_count}x</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default QuickReplyTemplates;
