import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SatisfactionSurveyProps {
  propertyId: string;
  reportId?: string;
}

const emojis = [
  { score: 1, emoji: "😟", label: "Very Concerned" },
  { score: 2, emoji: "😕", label: "Somewhat Concerned" },
  { score: 3, emoji: "😐", label: "Neutral" },
  { score: 4, emoji: "🙂", label: "Feeling Good" },
  { score: 5, emoji: "😊", label: "Very Confident" },
];

const SatisfactionSurvey = ({ propertyId, reportId }: SatisfactionSurveyProps) => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user || !reportId || propertyId.startsWith("mock-")) return;

    const checkIfShouldShow = async () => {
      // Check if already submitted for this report
      const { data } = await (supabase.from("client_satisfaction_scores" as any) as any)
        .select("id")
        .eq("client_id", user.id)
        .eq("report_id", reportId)
        .limit(1);

      if (!data || data.length === 0) {
        setShow(true);
      }
    };

    checkIfShouldShow();
  }, [user, reportId, propertyId]);

  const handleSubmit = async () => {
    if (!user || !selectedScore) return;
    setSubmitting(true);
    try {
      const { error } = await (supabase.from("client_satisfaction_scores" as any) as any).insert({
        client_id: user.id,
        report_id: reportId,
        score: selectedScore,
        comment: comment || null,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Thank you for your feedback!");
      setTimeout(() => setShow(false), 2000);
    } catch {
      toast.error("Failed to submit — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="bg-card rounded-lg border border-border shadow-hbc-sm overflow-hidden">
      <div className="bg-primary px-6 py-4 flex items-center justify-between">
        <h3 className="font-display text-lg text-primary-foreground">How do you feel about your home?</h3>
        <button onClick={() => setShow(false)} className="text-primary-foreground/50 hover:text-primary-foreground bg-transparent border-none cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6">
        {submitted ? (
          <div className="text-center py-4">
            <p className="font-display text-lg text-foreground mb-1">Thank you! 🎉</p>
            <p className="font-sans text-sm text-muted-foreground">Your feedback helps us serve you better.</p>
          </div>
        ) : (
          <>
            <p className="font-sans text-sm text-muted-foreground mb-6 text-center">
              After reviewing your Home Clarity Report, how confident do you feel about the state of your home?
            </p>

            <div className="flex items-center justify-center gap-4 mb-6">
              {emojis.map(({ score, emoji, label }) => (
                <button
                  key={score}
                  onClick={() => setSelectedScore(score)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all cursor-pointer bg-transparent ${
                    selectedScore === score
                      ? "border-accent bg-accent/5 scale-110"
                      : "border-transparent hover:border-border hover:bg-muted/30"
                  }`}
                  title={label}
                >
                  <span className="text-3xl">{emoji}</span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
                </button>
              ))}
            </div>

            {selectedScore && (
              <div className="space-y-4">
                <Textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Any additional thoughts? (optional)"
                  rows={2}
                />
                <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Submit Feedback
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SatisfactionSurvey;
