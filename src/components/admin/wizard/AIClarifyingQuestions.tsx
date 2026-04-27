import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import type { ClarifyingQuestion } from "@/contexts/WizardContext";

// Renders the clarifying questions returned by seed-report-from-notes
// (E7's stage 1). Each question is multi-choice; admin must pick one
// option per question (or hit Skip) before "Approve & Build TOC" enables.

interface AIClarifyingQuestionsProps {
  questions: ClarifyingQuestion[];
  answers: Record<string, string>;
  onAnswer: (id: string, optionId: string) => void;
}

export function AIClarifyingQuestions({
  questions,
  answers,
  onAnswer,
}: AIClarifyingQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <Card className="p-5 space-y-4 border-primary/30 bg-primary/[0.03]">
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-primary mt-0.5" aria-hidden />
        <div>
          <h3 className="text-sm font-sans font-semibold text-foreground">
            AI clarifying questions
          </h3>
          <p className="text-xs font-sans text-muted-foreground mt-0.5">
            Pick one answer per question. These nudge the report toward the
            right scope, sequence, and tone.
          </p>
        </div>
      </div>

      <ul className="space-y-4">
        {questions.map((q) => {
          const selected = answers[q.id];
          return (
            <li key={q.id} className="space-y-2">
              <div className="text-sm font-sans font-medium text-foreground">
                {q.question}
              </div>
              {q.why && (
                <p className="text-xs font-sans text-muted-foreground">
                  {q.why}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => {
                  const isSelected = selected === opt.id;
                  return (
                    <Button
                      key={opt.id}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => onAnswer(q.id, opt.id)}
                      className="min-h-[44px]"
                    >
                      {opt.label}
                    </Button>
                  );
                })}
                <Button
                  type="button"
                  variant={selected === "__skip__" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onAnswer(q.id, "__skip__")}
                  className="min-h-[44px]"
                >
                  Skip
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
