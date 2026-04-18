import { useState, useEffect } from "react";
import { Bell, Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Prefs {
  new_message: boolean;
  invoice_sent: boolean;
  payment_received: boolean;
  report_updated: boolean;
  project_status: boolean;
  maintenance_reminders: boolean;
  announcements: boolean;
  frequency: string;
}

const DEFAULT_PREFS: Prefs = {
  new_message: true,
  invoice_sent: true,
  payment_received: true,
  report_updated: true,
  project_status: true,
  maintenance_reminders: true,
  announcements: true,
  frequency: "immediately",
};

const PREF_LABELS: { key: keyof Omit<Prefs, "frequency">; label: string }[] = [
  { key: "new_message", label: "New message from my advisor" },
  { key: "invoice_sent", label: "Invoice sent or updated" },
  { key: "payment_received", label: "Payment received confirmation" },
  { key: "report_updated", label: "Report updated or published" },
  { key: "project_status", label: "Project status changed" },
  { key: "maintenance_reminders", label: "Maintenance reminders" },
  { key: "announcements", label: "Announcements & tips" },
];

const NotificationPreferences = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("client_notification_preferences")
        .select("*")
        .eq("client_id", user.id)
        .maybeSingle();

      if (data) {
        setPrefs({
          new_message: (data as any).new_message,
          invoice_sent: (data as any).invoice_sent,
          payment_received: (data as any).payment_received,
          report_updated: (data as any).report_updated,
          project_status: (data as any).project_status,
          maintenance_reminders: (data as any).maintenance_reminders,
          announcements: (data as any).announcements,
          frequency: (data as any).frequency,
        });
      }
      setLoaded(true);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("client_notification_preferences")
      .upsert({
        client_id: user.id,
        ...prefs,
        updated_at: new Date().toISOString(),
      }, { onConflict: "client_id" });

    setSaving(false);
    if (error) { toast.error("Failed to save preferences"); return; }
    toast.success("Notification preferences saved");
  };

  if (!loaded) return null;

  return (
    <div>
      <section className="text-center py-10 md:py-12 px-6 md:px-20 max-w-4xl mx-auto w-full">
        <h1 className="font-display text-3xl md:text-[36px] text-foreground mb-3">Notification Settings</h1>
        <p className="font-sans text-base text-muted-foreground">
          Control which notifications you receive.
        </p>
      </section>

      <div className="max-w-2xl mx-auto px-6 pb-16 space-y-6">
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-accent" />
            <h3 className="text-base font-sans font-semibold text-foreground">Email Notifications</h3>
          </div>

          <div className="space-y-4">
            {PREF_LABELS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-sm font-sans text-foreground cursor-pointer">{label}</Label>
                <Switch
                  checked={prefs[key]}
                  onCheckedChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-base font-sans font-semibold text-foreground">Notification Frequency</h3>
          <Select value={prefs.frequency} onValueChange={(v) => setPrefs((p) => ({ ...p, frequency: v }))}>
            <SelectTrigger className="font-sans">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediately">Immediately</SelectItem>
              <SelectItem value="daily">Daily Digest</SelectItem>
              <SelectItem value="weekly">Weekly Summary</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs font-sans text-muted-foreground">
            {prefs.frequency === "immediately" && "You'll receive an email for each event as it happens."}
            {prefs.frequency === "daily" && "You'll receive one email per day summarizing all activity."}
            {prefs.frequency === "weekly" && "You'll receive one email per week summarizing all activity."}
          </p>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full font-sans">
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
};

export default NotificationPreferences;
