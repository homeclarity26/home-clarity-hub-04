import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
          <div className="flex items-center justify-between">
            <h3 className="text-base font-sans font-semibold text-foreground">Notifications</h3>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">Coming Soon</span>
          </div>
          <p className="text-sm font-sans text-muted-foreground">Email and push notification preferences will be available here.</p>
        </Card>

        {/* Integrations */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-sans font-semibold text-foreground">Integrations</h3>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">Coming Soon</span>
          </div>
          <p className="text-sm font-sans text-muted-foreground">Connect Google Calendar, Stripe, and hover.to to streamline your workflow.</p>
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
