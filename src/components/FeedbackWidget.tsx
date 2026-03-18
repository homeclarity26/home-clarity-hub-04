import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface FeedbackWidgetProps {
  propertyId: string;
  entityType?: string;
  entityId?: string;
  title?: string;
}

const FeedbackWidget = ({ propertyId, entityType = "report", entityId, title = "How are we doing?" }: FeedbackWidgetProps) => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: existingFeedback } = useQuery({
    queryKey: ["feedback", propertyId, entityType, entityId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      let query = (supabase.from("feedback" as any) as any)
        .select("*")
        .eq("property_id", propertyId)
        .eq("entity_type", entityType)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (entityId) query = query.eq("entity_id", entityId);
      const { data } = await query;
      return data?.[0] || null;
    },
  });

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (supabase.from("feedback" as any) as any).insert({
        property_id: propertyId,
        user_id: user.id,
        entity_type: entityType,
        entity_id: entityId || null,
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;
      toast.success("Thank you for your feedback!");
      queryClient.invalidateQueries({ queryKey: ["feedback", propertyId] });
      setRating(0);
      setComment("");
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (existingFeedback) {
    return (
      <Card className="p-5 bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-sans font-semibold text-foreground">Your Feedback</h3>
        </div>
        <div className="flex gap-1 mb-1">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} className={`w-4 h-4 ${s <= existingFeedback.rating ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} />
          ))}
        </div>
        {existingFeedback.comment && (
          <p className="text-sm font-sans text-muted-foreground mt-1">"{existingFeedback.comment}"</p>
        )}
        <p className="text-xs font-sans text-muted-foreground/60 mt-2">Thank you for sharing your thoughts!</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-sans font-semibold text-foreground mb-3">{title}</h3>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s}
            onMouseEnter={() => setHoveredStar(s)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => setRating(s)}
            className="p-0.5 bg-transparent border-none cursor-pointer transition-transform hover:scale-110"
          >
            <Star className={`w-6 h-6 transition-colors ${s <= (hoveredStar || rating) ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} />
          </button>
        ))}
        {rating > 0 && (
          <span className="text-xs font-sans text-muted-foreground ml-2 self-center">
            {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
          </span>
        )}
      </div>
      {rating > 0 && (
        <>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Any additional thoughts? (optional)"
            className="text-sm font-sans mb-3"
            rows={2}
          />
          <Button size="sm" onClick={handleSubmit} disabled={submitting} className="font-sans">
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </>
      )}
    </Card>
  );
};

export default FeedbackWidget;
