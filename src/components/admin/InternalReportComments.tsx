import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CheckCircle, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface InternalReportCommentsProps {
  reportId: string | null | undefined;
}

const InternalReportComments = ({ reportId }: InternalReportCommentsProps) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open">("open");

  // Fetch pages for this report
  const { data: pages } = useQuery({
    queryKey: ["report-pages-for-comments", reportId],
    enabled: !!reportId,
    queryFn: async () => {
      const { data } = await supabase.from("report_pages").select("id, title").eq("report_id", reportId!).order("sort_order");
      return data || [];
    },
  });

  // Fetch internal comments
  const { data: comments, isLoading } = useQuery({
    queryKey: ["internal-report-comments", reportId],
    enabled: !!reportId,
    queryFn: async () => {
      if (!pages || pages.length === 0) {
        const { data: pgs } = await supabase.from("report_pages").select("id, title").eq("report_id", reportId!);
        if (!pgs || pgs.length === 0) return [];
        const pageIds = pgs.map((p) => p.id);
        const { data, error } = await supabase.from("internal_report_comments")
          .select("*")
          .in("report_page_id", pageIds)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((c: any) => ({
          ...c,
          pageTitle: pgs.find((p) => p.id === c.report_page_id)?.title || "Unknown",
        }));
      }
      const pageIds = pages.map((p) => p.id);
      const { data, error } = await supabase.from("internal_report_comments")
        .select("*")
        .in("report_page_id", pageIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((c: any) => ({
        ...c,
        pageTitle: pages.find((p) => p.id === c.report_page_id)?.title || "Unknown",
      }));
    },
  });

  const handleAdd = async () => {
    if (!newComment.trim() || !selectedPageId || !user) return;
    const { error } = await supabase.from("internal_report_comments").insert({
      report_page_id: selectedPageId,
      author_id: user.id,
      comment_text: newComment.trim(),
    });
    if (error) { toast.error("Failed to add comment"); return; }
    setNewComment("");
    queryClient.invalidateQueries({ queryKey: ["internal-report-comments", reportId] });
  };

  const handleResolve = async (id: string) => {
    await supabase.from("internal_report_comments")
      .update({ is_resolved: true, resolved_by: user?.id })
      .eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["internal-report-comments", reportId] });
  };

  const filtered = (comments || []).filter((c: any) => {
    if (filter === "open") return !c.is_resolved;
    return true;
  });

  const openCount = (comments || []).filter((c: any) => !c.is_resolved).length;

  if (!reportId) return <p className="text-sm font-sans text-muted-foreground text-center py-8">No report selected</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-sans font-semibold text-foreground">Internal Comments</h3>
          {openCount > 0 && (
            <Badge className="bg-accent/20 text-accent-foreground text-[10px] border-none">{openCount} open</Badge>
          )}
        </div>
        <div className="flex gap-1">
          {(["open", "all"] as const).map((f) => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="text-xs font-sans capitalize">
              {f === "open" ? "Open" : "All"}
            </Button>
          ))}
        </div>
      </div>

      {/* Add Comment */}
      <Card className="p-3">
        <div className="flex gap-2 mb-2">
          <select
            value={selectedPageId || ""}
            onChange={(e) => setSelectedPageId(e.target.value || null)}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-sans ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-[200px]"
          >
            <option value="">Select page...</option>
            {(pages || []).map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add internal note..."
            className="text-sm font-sans flex-1"
          />
          <Button size="sm" onClick={handleAdd} disabled={!newComment.trim() || !selectedPageId} className="gap-1 text-xs font-sans">
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((c: any) => (
            <Card key={c.id} className={`p-3 ${c.is_resolved ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] font-sans">{c.pageTitle}</Badge>
                    <span className="text-[10px] font-sans text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm font-sans text-foreground mt-1">{c.comment_text}</p>
                </div>
                {c.is_resolved ? (
                  <Badge className="bg-primary/10 text-foreground text-[10px] border-none gap-1 shrink-0">
                    <CheckCircle className="w-3 h-3" />Resolved
                  </Badge>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => handleResolve(c.id)} className="text-xs font-sans shrink-0">
                    Resolve
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-sm font-sans text-muted-foreground">No internal comments yet</p>
        </Card>
      )}
    </div>
  );
};

export default InternalReportComments;
