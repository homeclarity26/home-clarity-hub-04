import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Zap, Clock, AlertTriangle, MessageSquare, Calendar, Heart, FileText } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const DEFAULT_RULES = [
  { rule_type: "inactive_client", rule_name: "Inactive Client Check-In", rule_description: "Send a check-in message when a client hasn't logged in for X days.", icon: Clock, config: { days: 30 } },
  { rule_type: "equipment_service", rule_name: "Equipment Service Alert", rule_description: "Create a task when equipment service date is within X days and no project exists.", icon: AlertTriangle, config: { days: 60 } },
  { rule_type: "overdue_invoice", rule_name: "Overdue Invoice Follow-Up", rule_description: "Create a task and optionally message client when invoice is X days past due.", icon: FileText, config: { days: 14 } },
  { rule_type: "stale_project", rule_name: "Stale Project Reminder", rule_description: "Create a task when a project has been in 'Planned' status for X days.", icon: Calendar, config: { days: 45 } },
  { rule_type: "unanswered_message", rule_name: "Unanswered Message Alert", rule_description: "Create a task when client message has no admin reply within X hours.", icon: MessageSquare, config: { hours: 24 } },
  { rule_type: "poor_score", rule_name: "Poor Health Score Alert", rule_description: "Create a task when health score is Poor/Critical with no related project.", icon: Heart, config: {} },
  { rule_type: "anniversary", rule_name: "Client Anniversary", rule_description: "Create a task for annual renewal check-in.", icon: Calendar, config: {} },
];

const AdminAutomations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("automation_rules") as any).select("*").order("created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: logs } = useQuery({
    queryKey: ["automation-logs"],
    queryFn: async () => {
      const { data } = await (supabase.from("automation_logs") as any).select("*").order("triggered_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  // Initialize default rules if none exist
  useEffect(() => {
    if (rules && rules.length === 0 && user) {
      const initRules = async () => {
        for (const r of DEFAULT_RULES) {
          await (supabase.from("automation_rules") as any).insert({
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
    await (supabase.from("automation_rules") as any).update({ is_enabled: enabled }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
    toast.success(enabled ? "Automation enabled" : "Automation disabled");
  };

  const updateConfig = async (id: string, config: any) => {
    await (supabase.from("automation_rules") as any).update({ config_json: config }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
  };

  const getIcon = (ruleType: string) => {
    const def = DEFAULT_RULES.find(r => r.rule_type === ruleType);
    return def?.icon || Zap;
  };

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Settings", path: "/admin/settings" }, { label: "Automations" }]} />
      <div className="p-6 max-w-4xl space-y-6">
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
      </div>
    </div>
  );
};

export default AdminAutomations;
