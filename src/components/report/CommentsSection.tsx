import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, HelpCircle, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Comment {
  id: string;
  comment_text: string;
  comment_type: string;
  response_text: string | null;
  resolved: boolean;
  created_at: string;
  user_id: string;
}

interface CommentsSectionProps {
  reportPageId: string;
}

const CommentsSection = ({ reportPageId }: CommentsSectionProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState<"note" | "question">("question");
  const [isSending, setIsSending] = useState(false);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("report_comments")
      .select("*")
      .eq("report_page_id", reportPageId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load comments:", error);
    } else {
      setComments((data || []) as Comment[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [reportPageId]);

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return;
    setIsSending(true);

    const { error } = await supabase.from("report_comments").insert({
      report_page_id: reportPageId,
      user_id: user.id,
      comment_text: newComment.trim(),
      comment_type: commentType,
    });

    if (error) {
      toast.error("Failed to post comment");
      console.error(error);
    } else {
      setNewComment("");
      toast.success("Comment posted");
      fetchComments();
    }
    setIsSending(false);
  };

  if (!user) return null;

  return (
    <div className="mt-16 border-t border-border pt-10">
      <h3 className="font-display text-2xl text-foreground mb-6 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-accent" />
        Notes & Questions
      </h3>

      {/* Existing comments */}
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4 mb-8">
          {comments.map((c) => (
            <div key={c.id} className="border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  c.comment_type === "question" ? "bg-accent/20" : "bg-muted"
                }`}>
                  {c.comment_type === "question" ? (
                    <HelpCircle className="w-3.5 h-3.5 text-accent" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {c.comment_type === "question" ? "Question" : "Note"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-1 font-sans">{c.comment_text}</p>

                  {c.response_text && (
                    <div className="mt-3 pl-4 border-l-2 border-accent/30">
                      <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Response from HBC</p>
                      <p className="text-sm text-foreground font-sans">{c.response_text}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* New comment form */}
      <div className="space-y-3">
        <div className="flex gap-2">
          {(["question", "note"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setCommentType(t)}
              className={`text-xs font-sans px-3 py-1.5 rounded-full transition-colors ${
                commentType === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t === "question" ? "Ask a question" : "Leave a note"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
            placeholder={commentType === "question" ? "What would you like to know?" : "Add a note for your team..."}
            className="flex-1 h-11 bg-background border border-border rounded-lg px-4 text-sm text-foreground outline-none focus:border-accent transition-colors font-sans"
            disabled={isSending}
          />
          <Button onClick={handleSubmit} disabled={!newComment.trim() || isSending} size="icon" className="h-11 w-11 shrink-0">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommentsSection;
