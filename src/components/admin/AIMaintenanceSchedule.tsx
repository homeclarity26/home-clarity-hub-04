import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles, Loader2, Calendar, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AIMaintenanceScheduleProps {
  propertyId: string;
  equipment?: any[];
  propertyAge?: number;
  location?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PRIORITY_COLORS = { high: "text-destructive", medium: "text-accent", low: "text-muted-foreground" };

const AIMaintenanceSchedule = ({ propertyId, equipment, propertyAge, location }: AIMaintenanceScheduleProps) => {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ["ai-maintenance-schedule", propertyId],
    queryFn: async () => {
      const { data } = await supabase.from("ai_maintenance_schedules").select("*").eq("client_id", propertyId).order("generated_at", { ascending: false }).limit(1);
      return data?.[0] || null;
    },
  });

  const generate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-maintenance-schedule", {
        body: { equipment: equipment || [], propertyAge, location },
      });
      if (error) throw error;

      await supabase.from("ai_maintenance_schedules").insert({
        client_id: propertyId,
        schedule_json: data.schedule || [],
      });
      queryClient.invalidateQueries({ queryKey: ["ai-maintenance-schedule", propertyId] });
      toast.success("Schedule generated");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate schedule");
    }
    setIsGenerating(false);
  };

  type ScheduleItem = { month?: number; task_name?: string; task_description?: string };

  const applyToSchedule = async () => {
    const items = (existing?.schedule_json as ScheduleItem[] | null) ?? null;
    if (!items || !Array.isArray(items)) return;
    const currentYear = new Date().getFullYear();
    for (const item of items) {
      const month = (item.month || 1) - 1;
      const eventDate = new Date(currentYear, month, 15);
      await supabase.from("schedule_events").insert({
        property_id: propertyId,
        title: item.task_name ?? "Maintenance",
        description: item.task_description ?? null,
        event_date: eventDate.toISOString(),
        event_type: "reminder",
      });
    }
    await supabase.from("ai_maintenance_schedules").update({ applied_at: new Date().toISOString() }).eq("id", existing!.id);
    queryClient.invalidateQueries({ queryKey: ["ai-maintenance-schedule", propertyId] });
    toast.success("Schedule applied to client timeline");
  };

  const schedule = (existing?.schedule_json as ScheduleItem[] | undefined) ?? [];
  const byMonth = schedule.reduce((acc: Record<number, ScheduleItem[]>, item) => {
    const m = item.month || 1;
    if (!acc[m]) acc[m] = [];
    acc[m].push(item);
    return acc;
  }, {});

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">AI Maintenance Schedule</h3>
        </div>
        <div className="flex gap-2">
          {schedule.length > 0 && !existing?.applied_at && (
            <Button variant="outline" size="sm" onClick={applyToSchedule} className="gap-1 text-xs">
              <CheckCircle className="w-3.5 h-3.5" />Apply to Schedule
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={generate} disabled={isGenerating} className="gap-1 text-xs">
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {schedule.length === 0 ? "Generate" : "Regenerate"}
          </Button>
        </div>
      </div>

      {existing?.applied_at && <Badge variant="default" className="text-[10px] mb-3">✓ Applied to client schedule</Badge>}

      {schedule.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Generate an AI maintenance schedule based on this client's equipment and property.</p>
      ) : (
        <Accordion type="multiple" className="w-full">
          {Object.entries(byMonth).sort(([a], [b]) => Number(a) - Number(b)).map(([month, items]) => (
            <AccordionItem key={month} value={month}>
              <AccordionTrigger className="text-sm py-2">
                <span className="flex items-center gap-2">
                  {MONTHS[Number(month) - 1]}
                  <Badge variant="secondary" className="text-[10px]">{(items as any[]).length} tasks</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-2">
                  {(items as any[]).map((item: any, i: number) => (
                    <div key={i} className="p-2 rounded bg-muted/50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{item.task_name}</p>
                        <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS] || ""}`}>{item.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.task_description}</p>
                      {item.estimated_cost_range && <p className="text-xs text-accent mt-0.5">Est. {item.estimated_cost_range}</p>}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </Card>
  );
};

export default AIMaintenanceSchedule;
