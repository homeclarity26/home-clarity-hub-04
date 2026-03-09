import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, MessageSquare, HelpCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface CommentWithMeta {
  id: string;
  report_page_id: string;
  user_id: string;
  comment_text: string;
  comment_type: string;
  response_text: string | null;
  responded_by: string | null;
  resolved: boolean;
  created_at: string;
  updated_at: string;
  pageTitle?: string;
  commenterName?: string;
  commenterInitials?: string;
}

interface CommentsManagerProps {
  clientId?: string;
  reportId?: string | null;
}

const CommentsManager = ({ clientId, reportId }: CommentsManagerProps) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "unresolved" | "question" | "note">("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [comments, setComments] = useState<CommentWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = async () => {
    setIsLoading(true);
    let rawComments: CommentWithMeta[] = [];
    let pageMap: Record<string, string> = {};

    if (reportId) {
      const { data: pages } = await supabase
        .from("report_pages")
        .select("id, title")
        .eq("report_id", reportId);

      if (pages && pages.length > 0) {
        pageMap = Object.fromEntries(pages.map(p => [p.id, p.title]));
        const pageIds = pages.map(p => p.id);

        const { data, error } = await supabase
          .from("report_comments")
          .select("*")
          .in("report_page_id", pageIds)
          .order("created_at", { ascending: false });

        if (!error && data) {
          rawComments = (data as CommentWithMeta[]).map(c => ({
            ...c,
            pageTitle: pageMap[c.report_page_id] || "Unknown",
          }));
        }
      }
    } else {
      const { data, error } = await supabase
        .from("report_comments")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        rawComments = data as CommentWithMeta[];
      }
    }

    // Batch-fetch profiles for commenter names
    const userIds = [...new Set(rawComments.map(c => c.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_initials")
        .in("user_id", userIds);

      if (profiles) {
        const profileMap = Object.fromEntries(
          profiles.map(p => [p.user_id, { name: p.full_name, initials: p.avatar_initials }])
        );
        rawComments = rawComments.map(c => ({
          ...c,
          commenterName: profileMap[c.user_id]?.name || "Unknown",
          commenterInitials: profileMap[c.user_id]?.initials || "??",
        }));
      }
    }

    setComments(rawComments);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [reportId]);

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    const { error } = await supabase
      .from("report_comments")
      .update({
        response_text: replyText.trim(),
        resolved: true,
        responded_by: user?.id || null,
      })
      .eq("id", commentId);

    if (error) {
      toast.error("Failed to send reply");
    } else {
      toast.success("Reply sent");
      setReplyingTo(null);
      setReplyText("");
      fetchComments();
    }
  };

  const handleResolve = async (commentId: string) => {
    const { error } = await supabase
      .from("report_comments")
      .update({ resolved: true })
      .eq("id", commentId);

    if (error) {
      toast.error("Failed to resolve");
    } else {
      fetchComments();
    }
  };

  const filtered = comments.filter((c) => {
    if (filter === "all") return true;
    if (filter === "unresolved") return !c.resolved;
    return c.comment_type === filter;
  });

  const unresolvedCount = comments.filter(c => !c.resolved).length;
  const questionCount = comments.filter(c => c.comment_type === "question" && !c.resolved).length;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "unresolved", "question", "note"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="text-xs font-sans capitalize"
          >
            {f === "all" ? "All" : f === "unresolved" ? "Unresolved" : f === "question" ? "Questions" : "Notes"}
            {f === "unresolved" && unresolvedCount > 0 && (
              <Badge className="ml-1.5 bg-destructive/20 text-destructive text-[10px] border-none">
                {unresolvedCount}
              </Badge>
            )}
            {f === "question" && questionCount > 0 && (
              <Badge className="ml-1.5 bg-accent/20 text-accent-foreground text-[10px] border-none">
                {questionCount}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Comments */}
      {filtered.map((comment) => (
        <Card key={comment.id} className={`p-4 ${comment.resolved ? "opacity-60" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold ${
                comment.comment_type === "question" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
              }`}>
                {comment.commenterInitials || (comment.comment_type === "question" ? (
                  <HelpCircle className="w-4 h-4" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-sans font-medium text-foreground">
                    {comment.commenterName || "Unknown"}
                  </span>
                  {comment.pageTitle && (
                    <span className="text-[11px] font-sans text-muted-foreground">on {comment.pageTitle}</span>
                  )}
                  <span className="text-[11px] font-sans text-muted-foreground">
                    · {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm font-sans text-foreground mt-1">{comment.comment_text}</p>

                {comment.response_text && (
                  <div className="mt-3 pl-4 border-l-2 border-primary/20">
                    <p className="text-xs font-sans text-muted-foreground mb-0.5">Your response</p>
                    <p className="text-sm font-sans text-foreground">{comment.response_text}</p>
                  </div>
                )}

                {!comment.resolved && replyingTo === comment.id && (
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleReply(comment.id)}
                      placeholder="Type your response..."
                      className="text-sm font-sans"
                    />
                    <Button size="sm" onClick={() => handleReply(comment.id)} className="text-xs font-sans shrink-0">Send</Button>
                    <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="text-xs font-sans shrink-0">Cancel</Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {comment.resolved ? (
                <Badge className="bg-primary/10 text-foreground text-[10px] font-sans border-none gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Resolved
                </Badge>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setReplyingTo(comment.id)} className="text-xs font-sans">
                    Reply
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleResolve(comment.id)} className="text-xs font-sans text-muted-foreground">
                    Resolve
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm font-sans text-muted-foreground">No comments to display</p>
        </div>
      )}
    </div>
  );
};

export default CommentsManager;
