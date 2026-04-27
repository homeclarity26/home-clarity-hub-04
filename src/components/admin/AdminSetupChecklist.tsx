import { useState } from "react";
import { Check, ArrowRight, X, Settings, CreditCard, UserPlus, FileText, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTutorialProgress } from "@/hooks/useTutorialProgress";
import { useNavigate } from "react-router-dom";

const checklistItems = [
  { key: "add_first_client", title: "Add your first client", icon: UserPlus, path: "/admin/clients/new" },
  { key: "connect_stripe", title: "Connect Stripe for online payments", icon: CreditCard, path: "/admin/settings" },
  { key: "set_branding", title: "Set up your branding", icon: Settings, path: "/admin/settings" },
  { key: "publish_first_report", title: "Create your first report", icon: FileText, path: "/admin/clients" },
  { key: "configure_tiers", title: "Configure your membership tiers", icon: Crown, path: "/admin/settings?tab=tiers" },
];

const AdminSetupChecklist = () => {
  const navigate = useNavigate();
  const { progress, dismissAdminSetup } = useTutorialProgress();

  if (!progress || progress.admin_setup_dismissed) return null;

  const items = (progress.admin_setup_items_json || {}) as Record<string, boolean>;
  const completedTours = (progress.completed_tours || []) as string[];
  
  // Auto-check the dashboard tour item
  const isItemDone = (key: string) => {
    if (key === "complete_dashboard_tour") return completedTours.includes("dashboard-tour");
    return !!items[key];
  };

  const completedCount = checklistItems.filter((item) => isItemDone(item.key)).length;
  const allComplete = completedCount === checklistItems.length;

  if (allComplete) {
    return (
      <Card className="p-5 border-accent/30 bg-accent/5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <Check className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-sm font-sans font-semibold text-foreground">Setup complete.</p>
            <p className="text-xs font-sans text-muted-foreground">You're ready to run your business from HBC Creator.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 border-accent/30 mb-6 relative">
      <button
        onClick={() => dismissAdminSetup()}
        className="absolute top-3 right-3 p-1 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      <h3 className="font-display text-base text-foreground mb-1">Welcome to HBC Creator. Let's get you set up.</h3>
      <p className="text-xs font-sans text-muted-foreground mb-3">Complete these steps to get your admin account fully configured.</p>

      <div className="flex items-center gap-2 mb-4">
        <Progress value={(completedCount / checklistItems.length) * 100} className="flex-1 h-2 bg-muted [&>div]:bg-accent" />
        <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{completedCount} of {checklistItems.length} complete</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {checklistItems.map((item) => {
          const done = isItemDone(item.key);
          return (
            <div
              key={item.key}
              className={`flex items-center gap-2.5 p-2.5 rounded-md ${done ? "bg-accent/5" : "hover:bg-muted/50"} transition-colors`}
            >
              <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 ${done ? "bg-accent border-accent" : "border-muted-foreground/30"}`}>
                {done && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
              </div>
              <span className={`text-xs font-sans flex-1 ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {item.title}
              </span>
              {!done && (
                <button
                  onClick={() => navigate(item.path)}
                  className="text-[10px] font-sans text-accent hover:text-accent/80 bg-transparent border-none cursor-pointer whitespace-nowrap"
                >
                  Go →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default AdminSetupChecklist;
