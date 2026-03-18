import { TrendingUp, DollarSign, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";

interface InvestmentSummaryProps {
  replacementCostToday?: number;
  expectedLifespan?: number;
  currentAge?: number;
  timing?: string;
}

const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

const InvestmentSummary = ({
  replacementCostToday,
  expectedLifespan,
  currentAge,
  timing,
}: InvestmentSummaryProps) => {
  if (!replacementCostToday) return null;

  const cost5yr = Math.round(replacementCostToday * Math.pow(1.04, 5));

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <h4 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
        Investment Summary
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="font-sans text-lg font-bold text-foreground">{fmt(replacementCostToday)}</p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Replacement Cost Today
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="font-sans text-lg font-bold text-foreground">{fmt(cost5yr)}</p>
            <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              Est. Cost in 5 Years
            </p>
          </div>
        </div>
        {timing && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="font-sans text-lg font-bold text-foreground">{timing}</p>
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Recommended Timeline
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentSummary;
