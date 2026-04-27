import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Wrench, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  recommended_month: number;
  is_dismissed: boolean;
  completed_at: string | null;
  equipment_id: string | null;
}

interface MaintenanceRemindersProps {
  propertyId: string;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const MaintenanceReminders = ({ propertyId }: MaintenanceRemindersProps) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    if (!propertyId || propertyId.startsWith("mock-")) {
      setIsLoading(false);
      return;
    }
    const load = async () => {
      const { data } = await supabase.from("maintenance_reminders")
        .select("*")
        .eq("property_id", propertyId)
        .order("recommended_month", { ascending: true });

      if (data) setReminders(data as Reminder[]);
      setIsLoading(false);
    };
    load();
  }, [propertyId]);

  const handleComplete = async (id: string) => {
    const now = new Date().toISOString();
    await supabase.from("maintenance_reminders")
      .update({ completed_at: now })
      .eq("id", id);
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, completed_at: now } : r));
    toast.success("Marked as complete");
  };

  const thisMonth = reminders.filter((r) => r.recommended_month === currentMonth && !r.is_dismissed);
  const upcoming = reminders.filter((r) => r.recommended_month > currentMonth && r.recommended_month <= currentMonth + 2 && !r.is_dismissed);

  if (isLoading || (thisMonth.length === 0 && upcoming.length === 0)) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="w-4 h-4 text-accent" />
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Maintenance Reminders</p>
      </div>

      {thisMonth.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-sans font-semibold text-foreground">This Month: {MONTH_NAMES[currentMonth - 1]}</h3>
            <Badge variant="secondary" className="text-[10px]">{thisMonth.length} items</Badge>
          </div>
          <div className="space-y-3">
            {thisMonth.map((r) => (
              <button
                key={r.id}
                onClick={() => !r.completed_at && handleComplete(r.id)}
                disabled={!!r.completed_at}
                className="w-full flex items-start gap-3 text-left bg-transparent border-none cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors disabled:opacity-60"
              >
                {r.completed_at ? (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-sans ${r.completed_at ? "line-through text-muted-foreground" : "text-foreground"}`}>{r.title}</p>
                  {r.description && (
                    <p className="text-xs font-sans text-muted-foreground mt-0.5">{r.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {upcoming.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Coming Up</h3>
          <div className="space-y-2">
            {upcoming.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-2">
                <Badge variant="outline" className="text-[10px] shrink-0">{MONTH_NAMES[r.recommended_month - 1]}</Badge>
                <p className="text-sm font-sans text-muted-foreground">{r.title}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default MaintenanceReminders;
