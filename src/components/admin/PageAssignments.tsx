import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  reportPageId: string;
  pageTitle: string;
}

const PageAssignments = ({ reportPageId, pageTitle }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: assignments } = useQuery({
    queryKey: ["page-assignments", reportPageId],
    enabled: !!reportPageId,
    queryFn: async () => {
      const { data } = await (supabase.from("page_assignments" as any) as any)
        .select("*")
        .eq("report_page_id", reportPageId)
        .order("created_at");
      return (data || []) as { id: string; assigned_to: string; due_date: string | null; notes: string | null }[];
    },
  });

  const handleAssign = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await (supabase.from("page_assignments" as any) as any).insert({
        report_page_id: reportPageId,
        assigned_to: name.trim(),
        due_date: dueDate || null,
      });
      setName(""); setDueDate("");
      queryClient.invalidateQueries({ queryKey: ["page-assignments", reportPageId] });
      toast.success(`Assigned to ${name}`);
    } catch { toast.error("Failed to assign"); }
    finally { setSaving(false); }
  };

  const handleRemove = async (id: string) => {
    await (supabase.from("page_assignments" as any) as any).delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["page-assignments", reportPageId] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 font-sans">
          <UserPlus className="w-3 h-3" />
          {assignments && assignments.length > 0 ? assignments[0].assigned_to : "Assign"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-sans text-sm">Assign: {pageTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {assignments && assignments.length > 0 && (
            <div className="space-y-1">
              {assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 text-xs font-sans p-1.5 rounded bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{a.assigned_to}</span>
                    {a.due_date && <Badge variant="outline" className="text-[9px]">Due {new Date(a.due_date).toLocaleDateString()}</Badge>}
                  </div>
                  <button onClick={() => handleRemove(a.id)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-8 text-xs flex-1" />
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-8 text-xs w-32" />
          </div>
          <Button size="sm" className="w-full text-xs font-sans" onClick={handleAssign} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
            Add Assignment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PageAssignments;
