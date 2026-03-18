import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, MessageSquare } from "lucide-react";
import { computeProfitability, type ProfitabilityData } from "@/lib/profitabilityScore";

interface ProfitabilityCardProps {
  data: ProfitabilityData;
  compact?: boolean;
}

const fmt = (n: number) => {
  const abs = Math.abs(n);
  const s = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${abs.toFixed(0)}`;
  return n < 0 ? `-${s}` : s;
};

const ProfitabilityCard = ({ data, compact }: ProfitabilityCardProps) => {
  const result = computeProfitability(data);

  if (compact) {
    return (
      <Badge className={`text-[10px] font-sans font-bold border-none ${result.gradeColor}`}>
        {result.grade}
      </Badge>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-sans font-semibold text-foreground">Profitability</h4>
        <Badge className={`text-sm font-sans font-bold border-none px-3 py-1 ${result.gradeColor}`}>
          {result.grade}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
            <DollarSign className="w-3.5 h-3.5" />Revenue Collected
          </div>
          <span className="text-sm font-sans font-medium text-emerald-600">{fmt(result.revenue)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />Time Cost ({data.totalHours.toFixed(1)}h × ${data.targetHourlyRate})
          </div>
          <span className="text-sm font-sans font-medium text-destructive">-{fmt(result.timeCost)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
            <MessageSquare className="w-3.5 h-3.5" />Support Load ({data.messageCount} msgs)
          </div>
          <span className="text-sm font-sans font-medium text-destructive">-{fmt(result.supportCost)}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-sans font-semibold text-foreground">
            <TrendingUp className="w-3.5 h-3.5" />Net Profit
          </div>
          <span className={`text-sm font-sans font-bold ${result.netProfit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
            {fmt(result.netProfit)}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default ProfitabilityCard;
