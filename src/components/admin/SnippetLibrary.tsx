import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Copy, Trash2, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CATEGORIES = ["general", "roof", "hvac", "electrical", "plumbing", "kitchen", "bathroom", "exterior", "interior", "safety", "strategy"];

interface SnippetLibraryProps {
  onInsert?: (content: string) => void;
  mode?: "manage" | "pick";
}

const SnippetLibrary = ({ onInsert, mode = "manage" }: SnippetLibraryProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: snippets, isLoading } = useQuery({
    queryKey: ["narrative-snippets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("narrative_snippets")
        .select("*")
        .order("usage_count", { ascending: false });
      if (error) throw error;
      return (data || []) as { id: string; title: string; content: string; category: string; usage_count: number; created_at: string }[];
    },
  });

  const filtered = snippets?.filter((s) => {
    const matchesSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === "all" || s.category === filterCat;
    return matchesSearch && matchesCat;
  }) || [];

  const handleSave = async () => {
    if (!newTitle || !newContent || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("narrative_snippets").insert({
        title: newTitle, content: newContent, category: newCategory, created_by: user.id,
      });
      if (error) throw error;
      toast.success("Snippet saved");
      setNewTitle(""); setNewContent(""); setNewCategory("general"); setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["narrative-snippets"] });
    } catch { toast.error("Failed to save snippet"); }
    finally { setSaving(false); }
  };

  const handleInsert = async (snippet: { id: string; content: string }) => {
    onInsert?.(snippet.content);
    // Increment usage count
    await supabase.from("narrative_snippets")
      .update({ usage_count: (snippets?.find(s => s.id === snippet.id)?.usage_count || 0) + 1 })
      .eq("id", snippet.id);
    queryClient.invalidateQueries({ queryKey: ["narrative-snippets"] });
    if (mode === "pick") setOpen(false);
    toast.success("Snippet inserted");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("narrative_snippets").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["narrative-snippets"] });
    toast.success("Snippet deleted");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans">
          <BookOpen className="w-3.5 h-3.5" />
          {mode === "pick" ? "Insert Snippet" : "Snippet Library"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-sans">Narrative Snippet Library</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search snippets…" className="pl-8 h-8 text-sm" />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={() => setAddOpen(!addOpen)}>
            <Plus className="w-3.5 h-3.5" />
            New
          </Button>
        </div>

        {addOpen && (
          <div className="border border-border rounded-lg p-3 space-y-2 mt-2 bg-muted/30">
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Snippet title" className="h-8 text-sm" />
            <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Paste your reusable narrative paragraph here…" rows={3} className="text-sm" />
            <div className="flex items-center gap-2">
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSave} disabled={saving || !newTitle || !newContent}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 mt-2 min-h-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 font-sans">No snippets yet. Click "New" to create one.</p>
          ) : (
            filtered.map((s) => (
              <div key={s.id} className="border border-border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-sm font-medium">{s.title}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">{s.category}</Badge>
                    {s.usage_count > 0 && <span className="text-[10px] font-mono text-muted-foreground">Used {s.usage_count}×</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    {onInsert && (
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => handleInsert(s)}>
                        <Copy className="w-3 h-3" />Insert
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-sans line-clamp-2">{s.content}</p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SnippetLibrary;
