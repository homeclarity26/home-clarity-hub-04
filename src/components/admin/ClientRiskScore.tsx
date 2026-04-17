import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingDown, Shield, Clock, DollarSign, MessageSquare } from "lucide-react";
import type { AdminClient } from "@/hooks/useAdminData";

interface ClientRiskScoreProps {
  client: AdminClient;
  invoices?: { status: string; due_date: string | null; balance_due: number }[];
  lastActivity?: string;
}

interface RiskFactor {
  label: string;
  score: number; // 0-100, higher = more risk
  icon: typeof AlertTriangle;
  detail: string;
}

const computeRiskFactors = (client: AdminClient, invoices?: any[], lastActivity?: string): RiskFactor[] => {
  const factors: RiskFactor[] = [];

  // Payment risk
  const overdueCount = invoices?.filter((i) => i.status === "overdue").length || 0;
  const totalBalance = invoices?.reduce((s, i) => s + Number(i.balance_due), 0) || 0;
  const paymentRisk = Math.min(100, overdueCount * 30 + (totalBalance > 5000 ? 20 : totalBalance > 1000 ? 10 : 0));
  factors.push({
    label: "Payment Risk",
    score: paymentRisk,
    icon: DollarSign,
    detail: overdueCount > 0 ? `${overdueCount} overdue invoice(s), $${totalBalance.toFixed(0)} outstanding` : "All payments current",
  });

  // Engagement risk (unread messages = disengaged from us, or no activity)
  const engagementRisk = Math.min(100,
    (client.unreadMessages > 3 ? 40 : client.unreadMessages > 0 ? 15 : 0) +
    (client.unreadComments > 2 ? 30 : client.unreadComments > 0 ? 10 : 0)
  );
  factors.push({
    label: "Engagement",
    score: engagementRisk,
    icon: MessageSquare,
    detail: client.unreadMessages > 0 ? `${client.unreadMessages} unread messages` : "Active engagement",
  });

  // Report progress risk — only penalize when we actually have pages to judge
  // against. A freshly-seeded client with 0/0 pages shouldn't show up as 60%
  // risk on "Report Progress" before anyone has even started building the
  // report; that flagged too many new clients as at-risk.
  const completionPct = client.totalPages > 0 ? (client.completePages / client.totalPages) * 100 : 0;
  const progressRisk =
    client.totalPages === 0
      ? 0
      : completionPct < 25
        ? 60
        : completionPct < 50
          ? 35
          : completionPct < 75
            ? 15
            : 0;
  factors.push({
    label: "Report Progress",
    score: progressRisk,
    icon: Clock,
    detail:
      client.totalPages === 0
        ? "Report not started yet"
        : `${Math.round(completionPct)}% complete (${client.completePages}/${client.totalPages} pages)`,
  });

  // Flagged pages risk
  const flagRisk = Math.min(100, client.flaggedPages * 25);
  factors.push({
    label: "Quality Flags",
    score: flagRisk,
    icon: AlertTriangle,
    detail: client.flaggedPages > 0 ? `${client.flaggedPages} pages need review` : "No flagged pages",
  });

  return factors;
};

const getRiskLevel = (score: number) => {
  if (score >= 60) return { label: "High Risk", color: "bg-destructive/10 text-destructive", barColor: "bg-destructive" };
  if (score >= 30) return { label: "Medium Risk", color: "bg-amber-100 text-amber-700", barColor: "bg-amber-500" };
  return { label: "Low Risk", color: "bg-emerald-100 text-emerald-700", barColor: "bg-emerald-500" };
};

const ClientRiskScore = ({ client, invoices, lastActivity }: ClientRiskScoreProps) => {
  const factors = computeRiskFactors(client, invoices, lastActivity);
  const overallScore = Math.round(factors.reduce((s, f) => s + f.score, 0) / factors.length);
  const risk = getRiskLevel(overallScore);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-sans font-semibold text-foreground">Churn Risk Score</h3>
        </div>
        <Badge className={`${risk.color} text-[10px] border-none`}>{risk.label}</Badge>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <span className="text-3xl font-mono font-bold text-foreground">{overallScore}</span>
        <div className="flex-1">
          <Progress value={overallScore} className="h-2" />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] font-sans text-muted-foreground">Low</span>
            <span className="text-[10px] font-sans text-muted-foreground">High</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {factors.map((f) => {
          const Icon = f.icon;
          const level = getRiskLevel(f.score);
          return (
            <div key={f.label} className="flex items-center gap-3">
              <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-medium text-foreground">{f.label}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{f.score}</span>
                </div>
                <p className="text-[10px] font-sans text-muted-foreground truncate">{f.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ClientRiskScore;
