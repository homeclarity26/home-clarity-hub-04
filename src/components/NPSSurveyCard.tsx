import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface NPSSurveyCardProps {
  propertyId: string;
}

const EMOJIS = ["😡", "😠", "😞", "😕", "😐", "🙂", "😊", "😄", "🤩", "🥳", "💯"];

const NPSSurveyCard = ({ propertyId }: NPSSurveyCardProps) => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !propertyId || propertyId.startsWith("mock-")) return;

    const check = async () => {
      // Check if there's a recent survey (within 90 days)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);

      const { data: recent } = await (supabase.from("satisfaction_surveys" as any) as any)
        .select("id, snoozed_until")
        .eq("property_id", propertyId)
        .eq("user_id", user.id)
        .gte("created_at", cutoff.toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (recent && recent.length > 0) {
        const last = recent[0] as any;
        // If snoozed and not yet past snooze date
        if (last.snoozed_until && new Date(last.snoozed_until) > new Date()) return;
        // Already submitted a score recently
        if (!last.snoozed_until) return;
      }

      // Show after 5 second delay
      setTimeout(() => setVisible(true), 5000);
    };
    check();
  }, [user, propertyId]);

  const handleSubmit = async () => {
    if (score === null || !user) return;
    setSubmitting(true);

    await (supabase.from("satisfaction_surveys" as any) as any).insert({
      property_id: propertyId,
      user_id: user.id,
      trigger_event: "portal_visit",
      score,
      comment: comment.trim() || null,
    });

    // If low score, create alert task for admin
    if (score <= 6) {
      await (supabase.from("activity_log" as any) as any).insert({
        property_id: propertyId,
        user_id: user.id,
        action_type: "low_nps",
        message: `Low satisfaction score: ${score}/10`,
        metadata: { score, comment: comment.trim() },
      });
    }

    setSubmitting(false);
    setVisible(false);
    toast.success("Thank you for your feedback!");
  };

  const handleSnooze = async () => {
    if (!user) return;
    const snoozedUntil = new Date();
    snoozedUntil.setDate(snoozedUntil.getDate() + 7);

    await (supabase.from("satisfaction_surveys" as any) as any).insert({
      property_id: propertyId,
      user_id: user.id,
      trigger_event: "portal_visit",
      score: 0,
      snoozed_until: snoozedUntil.toISOString(),
    });

    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-sans font-semibold text-foreground leading-tight">
            How satisfied are you with your<br />Home Clarity Hub experience?
          </h3>
          <button onClick={() => setVisible(false)} className="p-1 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score selector */}
        <div className="flex items-center justify-between gap-1 mb-4">
          {EMOJIS.map((emoji, i) => (
            <button
              key={i}
              onClick={() => setScore(i)}
              className={`w-8 h-8 rounded-md flex items-center justify-center text-base border-none cursor-pointer transition-all ${
                score === i
                  ? "bg-accent/20 scale-110 ring-2 ring-accent"
                  : "bg-transparent hover:bg-muted"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-4">
          <span>Not likely</span>
          <span>Very likely</span>
        </div>

        {score !== null && (
          <div className="space-y-3">
            <Textarea
              placeholder="Anything you'd like to share? (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="text-sm font-sans"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 font-sans"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="font-sans text-muted-foreground"
                onClick={handleSnooze}
              >
                Maybe Later
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NPSSurveyCard;
