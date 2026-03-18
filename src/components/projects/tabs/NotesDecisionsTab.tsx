import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Lock, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useProjectDecisions, logProjectActivity } from "@/hooks/useProjectData";

interface Props { projectId: string; }

const NotesDecisionsTab = ({ projectId }: Props) => {
  const { user } = useAuth(); const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [dec, setDec] = useState(""); const [by, setBy] = useState("");
  const { data: decisions } = useProjectDecisions(projectId);

  const addDec = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("project_decisions").insert({ project_id: projectId, decision: dec, decided_by: by || null }); if (error) throw error; await logProjectActivity(projectId, "decision_recorded", `Decision: "${dec.substring(0, 60)}..."`, user?.id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project-decisions", projectId] }); qc.invalidateQueries({ queryKey: ["project-activity-recent", projectId] }); setDec(""); setBy(""); setShowAdd(false); toast.success("Decision recorded"); },
  });

  const lockDec = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("project_decisions").update({ is_client_approved: true, locked_at: new Date().toISOString() }).eq("id", id); if (error) throw error; await logProjectActivity(projectId, "decision_locked", "Decision locked as client-approved", user?.id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project-decisions", projectId] }); toast.success("Decision locked"); },
  });

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between"><h3 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2"><BookOpen className="w-4 h-4 text-muted-foreground" />Decision Log</h3><Button size="sm" className="gap-1 text-xs font-sans" onClick={() => setShowAdd(true)}><Plus className="w-3.5 h-3.5" />Record Decision</Button></div>
      {showAdd && (<Card className="p-4 space-y-3"><Textarea value={dec} onChange={(e) => setDec(e.target.value)} placeholder="Describe the decision..." className="text-sm" rows={2} /><Input value={by} onChange={(e) => setBy(e.target.value)} placeholder="Decided by" className="text-sm" /><div className="flex gap-2"><Button size="sm" className="text-xs" onClick={() => addDec.mutate()} disabled={!dec.trim() || addDec.isPending}>Save</Button><Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowAdd(false)}>Cancel</Button></div></Card>)}
      {(decisions || []).length === 0 ? <Card className="p-8 text-center"><p className="text-sm text-muted-foreground font-sans">No decisions recorded yet.</p></Card> : (
        <div className="space-y-2">{decisions!.map((d) => (<Card key={d.id} className={`p-4 ${d.is_client_approved ? "border-primary/30 bg-primary/5" : ""}`}><div className="flex items-start justify-between gap-3"><div className="flex-1"><p className="text-sm font-sans text-foreground">{d.decision}</p><div className="flex items-center gap-2 mt-1"><span className="text-[10px] text-muted-foreground font-sans">{format(new Date(d.decided_at), "MMM d, yyyy")}</span>{d.decided_by && <span className="text-[10px] text-muted-foreground font-sans">by {d.decided_by}</span>}{d.is_client_approved && <Badge variant="default" className="text-[9px] h-4 gap-0.5"><Lock className="w-2.5 h-2.5" />Approved</Badge>}</div></div>{!d.is_client_approved && <Button size="sm" variant="outline" className="text-[10px] h-7 gap-1" onClick={() => lockDec.mutate(d.id)}><Lock className="w-3 h-3" />Lock</Button>}</div></Card>))}</div>
      )}
    </div>
  );
};

export default NotesDecisionsTab;
