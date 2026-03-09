import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, MessageSquare, HelpCircle } from "lucide-react";
import { mockComments, type MockComment } from "@/data/adminMockData";

interface CommentsManagerProps {
  clientId?: string;
}

const CommentsManager = ({ clientId }: CommentsManagerProps) => {
  const [filter, setFilter] = useState<"all" | "question" | "note">("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const comments = clientId
    ? mockComments.filter((c) => c.clientId === clientId)
    : mockComments;

  const filtered = filter === "all" ? comments : comments.filter((c) => c.type === filter);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "question", "note"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="text-xs font-sans capitalize"
          >
            {f === "all" ? "All" : f === "question" ? "Questions" : "Notes"}
            {f === "question" && (
              <Badge className="ml-1.5 bg-accent/20 text-accent-foreground text-[10px] border-none">
                {comments.filter((c) => c.type === "question" && !c.resolved).length}
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                comment.type === "question" ? "bg-accent/20" : "bg-muted"
              }`}>
                {comment.type === "question" ? (
                  <HelpCircle className="w-4 h-4 text-accent" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-sans font-medium text-foreground">{comment.clientName}</span>
                  <span className="text-[11px] font-sans text-muted-foreground">on {comment.pageTitle}</span>
                  <span className="text-[11px] font-sans text-muted-foreground">· {comment.date}</span>
                </div>
                <p className="text-sm font-sans text-foreground mt-1">{comment.text}</p>

                {comment.response && (
                  <div className="mt-3 pl-4 border-l-2 border-primary/20">
                    <p className="text-xs font-sans text-muted-foreground mb-0.5">Your response</p>
                    <p className="text-sm font-sans text-foreground">{comment.response}</p>
                  </div>
                )}

                {!comment.resolved && replyingTo === comment.id && (
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your response..."
                      className="text-sm font-sans"
                    />
                    <Button size="sm" className="text-xs font-sans shrink-0">Send</Button>
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
                  <Button variant="ghost" size="sm" className="text-xs font-sans text-muted-foreground">
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
