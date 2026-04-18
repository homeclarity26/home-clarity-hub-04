import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const SLASettings = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [msgHours, setMsgHours] = useState(24);
  const [reportDays, setReportDays] = useState(14);
  const [firstContactHours, setFirstContactHours] = useState(4);
  const [saving, setSaving] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["sla-config"],
    queryFn: async () => {
      const { data } = await supabase.from("sla_configs").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  const { data: tracking = [] } = useQuery({
    queryKey: ["sla-tracking"],
    queryFn: async () => {
      const { data } = await supabase.from("sla_tracking").select("*").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  useEffect(() => {
    if (config) {
      setMsgHours(config.message_response_hours);
      setReportDays(config.report_delivery_days);
      setFirstContactHours(config.first_contact_hours);
    }
  }, [config]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    if (config?.id) {
      await supabase.from("sla_configs").update({
        message_response_hours: msgHours, report_delivery_days: reportDays, first_contact_hours: firstContactHours,
      }).eq("id", config.id);
    } else {
      await supabase.from("sla_configs").insert({
        admin_id: user.id, message_response_hours: msgHours, report_delivery_days: reportDays, first_contact_hours: firstContactHours,
      });
    }
    setSaving(false);
    qc.invalidateQueries({ queryKey: ["sla-config"] });
    toast.success("SLA targets saved");
  };

  const met = tracking.filter((t: any) => t.was_met === true).length;
  const breached = tracking.filter((t: any) => t.was_met === false).length;
  const metRate = tracking.length > 0 ? Math.round((met / tracking.length) * 100) : 100;

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" />
          <h3 className="text-base font-sans font-semibold text-foreground">SLA Configuration</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Message Response Time</Label>
            <div className="flex items-center gap-2">
              <Input type="number" value={msgHours} onChange={e => setMsgHours(Number(e.target.value))} className="font-mono w-20" />
              <span className="text-xs font-sans text-muted-foreground">hours</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Report Delivery Time</Label>
            <div className="flex items-center gap-2">
              <Input type="number" value={reportDays} onChange={e => setReportDays(Number(e.target.value))} className="font-mono w-20" />
              <span className="text-xs font-sans text-muted-foreground">business days</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">First Contact After Signup</Label>
            <div className="flex items-center gap-2">
              <Input type="number" value={firstContactHours} onChange={e => setFirstContactHours(Number(e.target.value))} className="font-mono w-20" />
              <span className="text-xs font-sans text-muted-foreground">hours</span>
            </div>
          </div>
        </div>
        <Button size="sm" className="font-sans" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save SLA Targets"}
        </Button>
      </Card>

      {/* SLA Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-sans font-bold text-foreground">{metRate}%</p>
          <p className="text-[11px] font-sans text-muted-foreground">SLA Met Rate</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-sans font-bold text-foreground">{met}</p>
          <p className="text-[11px] font-sans text-muted-foreground">Met</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-sans font-bold text-destructive">{breached}</p>
          <p className="text-[11px] font-sans text-muted-foreground">Breached</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-sans font-bold text-foreground">{tracking.length}</p>
          <p className="text-[11px] font-sans text-muted-foreground">Total Tracked</p>
        </Card>
      </div>

      {/* Recent SLA Events */}
      {tracking.length > 0 && (
        <Card className="p-5">
          <h4 className="text-sm font-sans font-semibold text-foreground mb-3">Recent SLA Events</h4>
          <div className="space-y-2">
            {tracking.slice(0, 10).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  {t.was_met ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                  <span className="text-xs font-sans">{t.sla_type.replace("_", " ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={t.was_met ? "secondary" : "destructive"} className="text-[10px]">
                    {t.was_met ? "Met" : "Breached"}
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SLASettings;
