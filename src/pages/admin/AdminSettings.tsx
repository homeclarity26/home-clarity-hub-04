import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import AdminHeader from "@/components/admin/AdminHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminSettings = () => {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setEmail(profile.email || user?.email || "");
      setPhone(profile.phone || "");
    }
  }, [profile, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, email, phone })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Settings saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Settings" }]} />
      <div className="p-6 max-w-3xl space-y-6">
        {/* Account */}
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="font-sans" />
            </div>
          </div>
          <Button size="sm" className="font-sans" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Card>

        {/* Notifications */}
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">Notifications</h3>
          <div className="space-y-4">
            {[
              { label: "Client comments & questions", desc: "Get notified when clients leave comments" },
              { label: "Report published", desc: "Confirmation when a report goes live" },
              { label: "File uploads", desc: "When new files are uploaded to a client" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-sans text-foreground">{item.label}</p>
                  <p className="text-xs font-sans text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </Card>

        {/* Integrations */}
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">Integrations</h3>
          <div className="space-y-4">
            {[
              { label: "Google Calendar", desc: "Sync appointments and reminders", connected: false },
              { label: "Stripe", desc: "Payment processing for invoices", connected: false },
              { label: "hover.to", desc: "3D property measurement data", connected: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-sans text-foreground">{item.label}</p>
                  <p className="text-xs font-sans text-muted-foreground">{item.desc}</p>
                </div>
                <Button variant={item.connected ? "outline" : "default"} size="sm" className="text-xs font-sans">
                  {item.connected ? "Connected" : "Connect"}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Region */}
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">Default Region</h3>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Service Area</Label>
            <Input defaultValue="Summit County, OH" className="font-sans" />
          </div>
          <Button size="sm" className="font-sans">Update</Button>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
