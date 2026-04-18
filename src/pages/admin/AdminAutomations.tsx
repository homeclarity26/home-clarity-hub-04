import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Zap, Clock, AlertTriangle, MessageSquare, Calendar, Heart, FileText } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import OnboardingWorkflowBuilder from "@/components/admin/OnboardingWorkflowBuilder";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const DEFAULT_RULES = [
  { rule_type: "welcome_email", rule_name: "Send Welcome Email", rule_description: "Automatically send a welcome email when a new client is created.", icon: MessageSquare, config: {} },
  { rule_type: "post_report_followup", rule_name: "Post-Report Follow-Up Task", rule_description: "Create a follow-up task 7 days after a report is published.", icon: Calendar, config: { days: 7 } },
  { rule_type: "invoice_reminder", rule_name: "Invoice Due Reminder", rule_description: "Send an invoice reminder 3 days before the due date.", icon: FileText, config: { days: 3 } },
  { rule_type: "inactive_client", rule_name: "Flag At-Risk Client", rule_description: "Flag client as 'at risk' if no portal activity in 60 days.", icon: AlertTriangle, config: { days: 60 } },
  { rule_type: "unanswered_message", rule_name: "Unanswered Message Alert", rule_description: "Notify admin when a client message goes unanswered for 24 hours.", icon: MessageSquare, config: { hours: 24 } },
  { rule_type: "equipment_service", rule_name: "Equipment Service Alert", rule_description: "Create a task when equipment service date is within X days.", icon: AlertTriangle, config: { days: 60 } },
  { rule_type: "stale_project", rule_name: "Stale Project Reminder", rule_description: "Create a task when a project has been in 'Planned' status for X days.", icon: Calendar, config: { days: 45 } },
  // CRM Client Automations
  { rule_type: "portal_inactivity", rule_name: "Portal Inactivity Check-In", rule_description: "Send check-in message when client hasn't logged into portal in X days.", icon: Heart, config: { days: 30 } },
  { rule_type: "health_score_drop", rule_name: "Health Score Drop Alert", rule_description: "Flag client and create follow-up task when health score drops below threshold.", icon: AlertTriangle, config: { threshold: 60 } },
  { rule_type: "invoice_overdue_escalate", rule_name: "Invoice Overdue Escalation", rule_description: "Send reminder then escalate when invoice is unpaid X days after due date.", icon: FileText, config: { days: 7 } },
  { rule_type: "client_completed_survey", rule_name: "Completion Survey & Referral Ask", rule_description: "Send satisfaction survey + referral request when client moves to 'Completed' stage.", icon: Heart, config: {} },
  { rule_type: "new_client_welcome_sequence", rule_name: "New Client Welcome Sequence", rule_description: "Day 1 welcome email, Day 7 call task, Day 30 check-in for every new client.", icon: Calendar, config: { day1: true, day7: true, day30: true } },
  // CRM Trade Partner Automations
  { rule_type: "insurance_expiry_reminder", rule_name: "Insurance Expiry Reminder", rule_description: "Send renewal reminder when trade partner insurance expires within X days.", icon: AlertTriangle, config: { days: 60 } },
  { rule_type: "license_expiry_reminder", rule_name: "License Expiry Reminder", rule_description: "Send renewal reminder when trade partner license expires within X days.", icon: AlertTriangle, config: { days: 60 } },
  { rule_type: "partner_inactivity", rule_name: "Partner Availability Check", rule_description: "Prompt to check availability when trade partner hasn't been assigned a project in X days.", icon: Calendar, config: { days: 90 } },
  { rule_type: "bid_response_timeout", rule_name: "Bid Response Timeout", rule_description: "Send reminder + admin alert when bid invitation isn't responded to in X days.", icon: MessageSquare, config: { days: 5 } },
  { rule_type: "project_completion_review", rule_name: "Post-Project Performance Review", rule_description: "Auto-send performance review request when a project is marked complete.", icon: Heart, config: {} },
];

const AdminAutomations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("automation_rules").select("*").order("created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: logs } = useQuery({
    queryKey: ["automation-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("automation_logs").select("*").order("triggered_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  // Initialize default rules if none exist
  useEffect(() => {
    if (rules && rules.length === 0 && user) {
      const initRules = async () => {
        for (const r of DEFAULT_RULES) {
          await supabase.from("automation_rules").insert({
            rule_type: r.rule_type,
            rule_name: r.rule_name,
            rule_description: r.rule_description,
            config_json: r.config,
            is_enabled: false,
            admin_id: user.id,
          });
        }
        queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      };
      initRules();
    }
  }, [rules, user]);

  const toggleRule = async (id: string, enabled: boolean) => {
    await supabase.from("automation_rules").update({ is_enabled: enabled }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
    toast.success(enabled ? "Automation enabled" : "Automation disabled");
  };

  const updateConfig = async (id: string, config: any) => {
    await supabase.from("automation_rules").update({ config_json: config }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
  };

  const getIcon = (ruleType: string) => {
    const def = DEFAULT_RULES.find(r => r.rule_type === ruleType);
    return def?.icon || Zap;
  };

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Tools" }, { label: "Automations" }]} />
      <div className="p-6 max-w-4xl space-y-6">
        <Tabs defaultValue="rules" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="rules" className="font-sans text-xs">Automation Rules</TabsTrigger>
            <TabsTrigger value="onboarding" className="font-sans text-xs">Onboarding Workflows</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Smart Automations</h2>
          <p className="text-sm text-muted-foreground">Configure automatic task creation and notifications based on client activity.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-3">
            {(rules || []).map((rule: any) => {
              const Icon = getIcon(rule.rule_type);
              const config = rule.config_json || {};
              return (
                <Card key={rule.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${rule.is_enabled ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon className={`w-5 h-5 ${rule.is_enabled ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-foreground">{rule.rule_name}</h3>
                        <Switch checked={rule.is_enabled} onCheckedChange={v => toggleRule(rule.id, v)} />
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{rule.rule_description}</p>
                      
                      {/* Config fields */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {config.days !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <Label className="text-xs text-muted-foreground">Days:</Label>
                            <Input type="number" value={config.days} onChange={e => updateConfig(rule.id, { ...config, days: Number(e.target.value) })} className="w-16 h-7 text-xs" />
                          </div>
                         )}
                        {config.threshold !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <Label className="text-xs text-muted-foreground">Threshold:</Label>
                            <Input type="number" value={config.threshold} onChange={e => updateConfig(rule.id, { ...config, threshold: Number(e.target.value) })} className="w-16 h-7 text-xs" />
                          </div>
                        )}
                        {config.hours !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <Label className="text-xs text-muted-foreground">Hours:</Label>
                            <Input type="number" value={config.hours} onChange={e => updateConfig(rule.id, { ...config, hours: Number(e.target.value) })} className="w-16 h-7 text-xs" />
                          </div>
                        )}
                        {rule.last_triggered_at && (
                          <Badge variant="secondary" className="text-[10px]">Last: {format(new Date(rule.last_triggered_at), "MMM d, h:mm a")}</Badge>
                        )}
                        {rule.trigger_count > 0 && (
                          <Badge variant="outline" className="text-[10px]">{rule.trigger_count} triggers</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Recent Automation Logs */}
        {(logs || []).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
            <Card className="divide-y divide-border">
              {(logs || []).slice(0, 10).map((log: any) => (
                <div key={log.id} className="p-3 flex items-center gap-3">
                  <Zap className="w-4 h-4 text-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">{log.action_taken_description}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(log.triggered_at), "MMM d, yyyy h:mm a")}</p>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}
          </TabsContent>

          <TabsContent value="onboarding">
            <OnboardingWorkflowBuilder />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminAutomations;
