import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CheckSquare, DollarSign, Wrench, AlertTriangle, Users, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useAdminStats, useClientsNeedingAttention } from "@/hooks/useAdminData";

const DailyBrief = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: stats } = useAdminStats();
  const { data: attention } = useClientsNeedingAttention();
  const [insightIndex, setInsightIndex] = useState(0);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const firstName = profile?.full_name?.split(" ")[0] || "Creator";
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const unreadMessages = stats?.unansweredQuestions ?? 0;
  const overdueInvoices = stats?.overdueInvoices ?? 0;
  const inactiveClients = (attention || []).length;

  const items = [
    { icon: MessageSquare, label: `${unreadMessages} unread messages`, value: unreadMessages, link: "/admin/inbox" },
    { icon: DollarSign, label: `${overdueInvoices} invoices overdue`, value: overdueInvoices, link: "/admin/clients" },
    { icon: Users, label: `${inactiveClients} clients need attention`, value: inactiveClients, link: "/admin/clients" },
  ].filter(item => item.value > 0);

  const insights = useMemo(() => {
    const list = [
      `Your collection rate is ${stats?.totalInvoiced ? Math.round(((stats?.totalCollected || 0) / stats.totalInvoiced) * 100) : 100}%.`,
      `You have ${stats?.activeClients ?? 0} active clients and ${stats?.publishedReports ?? 0} published reports.`,
      `${stats?.reportsInProgress ?? 0} reports are currently in progress.`,
    ];
    return list;
  }, [stats]);

  // Rotate insights
  useEffect(() => {
    const stored = localStorage.getItem("hbc_insight_idx");
    const last = parseInt(stored || "0");
    const next = (last + 1) % insights.length;
    setInsightIndex(next);
    localStorage.setItem("hbc_insight_idx", String(next));
  }, []); // eslint-disable-line

  const allClear = items.length === 0;

  return (
    <div className="space-y-4">
      {/* Brief Card */}
      <Card className="p-6 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="font-display text-2xl md:text-3xl">{dateStr}</p>
            <p className="font-sans text-sm text-primary-foreground/70 mt-1">{greeting}, {firstName}.</p>
          </div>
          <div className="space-y-2 md:text-right">
            {allClear ? (
              <div className="flex items-center gap-2 text-primary-foreground/80">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-sans">All clear today — nothing urgent needs your attention.</span>
              </div>
            ) : (
              items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => navigate(item.link)}
                  className="flex items-center gap-2 text-sm font-sans text-primary-foreground/90 hover:text-primary-foreground transition-colors bg-transparent border-none cursor-pointer md:ml-auto"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Insight Card */}
      <Card className="p-4 border-l-[3px] border-l-accent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <p className="text-sm font-sans text-foreground">{insights[insightIndex]}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-sans text-accent"
            onClick={() => {
              const next = (insightIndex + 1) % insights.length;
              setInsightIndex(next);
              localStorage.setItem("hbc_insight_idx", String(next));
            }}
          >
            Next Insight →
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DailyBrief;
