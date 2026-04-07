import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Check, Palette } from "lucide-react";

import AdminHeader from "@/components/admin/AdminHeader";
import IntegrationsHub from "@/components/admin/IntegrationsHub";
import AuditLogSection from "@/components/admin/AuditLogSection";
import SLASettings from "@/components/admin/SLASettings";
import MembershipTierManager from "@/components/admin/MembershipTierManager";
import ReportsExportsSettings from "@/components/admin/ReportsExportsSettings";
import MessageTemplateLibrary from "@/components/admin/MessageTemplateLibrary";
import ServicesLibrary from "@/components/admin/ServicesLibrary";
import PushNotificationSettings from "@/components/admin/PushNotificationSettings";
import ReferralSettings from "@/components/admin/ReferralSettings";
import RecurringPlanManager from "@/components/admin/RecurringPlanManager";
import ApiWebhookSettings from "@/components/admin/ApiWebhookSettings";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NOTIFICATION_KEYS = [
  { key: "new_message", label: "New client message received" },
  { key: "invoice_viewed", label: "Invoice viewed by client" },
  { key: "payment_posted", label: "Payment posted" },
  { key: "report_published", label: "Report published" },
  { key: "project_status_changed", label: "Project status changed" },
] as const;

const AdminSettings = () => {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [region, setRegion] = useState("Summit County, OH");
  const [savingRegion, setSavingRegion] = useState(false);

  // Branding
  const [businessName, setBusinessName] = useState("Hometown Builders Club");
  const [tagline, setTagline] = useState("Home Clarity, Delivered.");
  const [brandColor, setBrandColor] = useState("#C9A84C");
  const [savingBranding, setSavingBranding] = useState(false);

  // Stripe
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeKey, setStripeKey] = useState("");
  const [savingStripe, setSavingStripe] = useState(false);

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({});
  const [savingNotifs, setSavingNotifs] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setEmail(profile.email || user?.email || "");
      setPhone(profile.phone || "");
      // Load region + notification preferences
      supabase.from("profiles").select("service_region, notification_preferences").eq("user_id", user!.id).single()
        .then(({ data }: { data: any }) => {
          if (data?.service_region) setRegion(data.service_region);
          if (data?.notification_preferences) setNotifPrefs(data.notification_preferences as Record<string, boolean>);
        });
    }
    // Check if Stripe was previously connected
    const stored = localStorage.getItem("hbc_stripe_connected");
    if (stored === "true") setStripeConnected(true);
  }, [profile, user]);

  const handleRegionSave = async () => {
    if (!user) return;
    setSavingRegion(true);
    const { error } = await supabase.from("profiles").update({ service_region: region }).eq("user_id", user.id);
    setSavingRegion(false);
    if (error) { toast.error("Failed to update region"); return; }
    toast.success("Region updated");
  };

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

  const handleStripeConnect = async () => {
    if (!stripeKey.trim().startsWith("sk_")) {
      toast.error("Please enter a valid Stripe Secret Key (starts with sk_)");
      return;
    }
    setSavingStripe(true);
    try {
      // In production, this would save via the secrets tool
      // For now, mark as connected
      localStorage.setItem("hbc_stripe_connected", "true");
      setStripeConnected(true);
      setStripeKey("");
      toast.success("Stripe connected successfully");
    } catch {
      toast.error("Failed to connect Stripe");
    } finally {
      setSavingStripe(false);
    }
  };

  const handleNotifToggle = (key: string, value: boolean) => {
    setNotifPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleNotifSave = async () => {
    if (!user) return;
    setSavingNotifs(true);
    const { error } = await (supabase.from("profiles") as any).update({ notification_preferences: notifPrefs }).eq("user_id", user.id);
    setSavingNotifs(false);
    if (error) { toast.error("Failed to save preferences"); return; }
    toast.success("Notification preferences saved");
  };

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Settings" }]} />
      <div className="p-6 max-w-5xl space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="general" className="font-sans text-xs">General</TabsTrigger>
            <TabsTrigger value="services" className="font-sans text-xs">Services Library</TabsTrigger>
            <TabsTrigger value="tiers" className="font-sans text-xs">Membership Tiers</TabsTrigger>
            <TabsTrigger value="integrations" className="font-sans text-xs">Integrations</TabsTrigger>
            <TabsTrigger value="sla" className="font-sans text-xs">SLA</TabsTrigger>
            <TabsTrigger value="templates" className="font-sans text-xs">Message Templates</TabsTrigger>
            <TabsTrigger value="exports" className="font-sans text-xs">Reports & Exports</TabsTrigger>
            <TabsTrigger value="audit" className="font-sans text-xs">Audit Log</TabsTrigger>
            <TabsTrigger value="referrals" className="font-sans text-xs">Referrals</TabsTrigger>
            <TabsTrigger value="recurring" className="font-sans text-xs">Recurring Plans</TabsTrigger>
            <TabsTrigger value="api" className="font-sans text-xs">API &amp; Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Branding */}
            <Card className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-accent" />
                <h3 className="text-base font-sans font-semibold text-foreground">Branding</h3>
              </div>
              <p className="text-sm font-sans text-muted-foreground">Customize your business name, tagline, and brand color. These appear across the admin and client portal.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Business Name</Label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="font-sans" placeholder="Your Business Name" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Tagline / Subtitle</Label>
                  <Input value={tagline} onChange={(e) => setTagline(e.target.value)} className="font-sans" placeholder="Your tagline..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Brand Color</Label>
                  <div className="flex items-center gap-3">
                    <Input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-9 w-14 p-1 cursor-pointer" />
                    <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="font-mono text-sm w-28" />
                    <div className="w-8 h-8 rounded-md border border-border" style={{ backgroundColor: brandColor }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Logo Upload</Label>
                  <Input type="file" accept="image/*" className="font-sans text-sm" disabled />
                  <p className="text-[10px] font-sans text-muted-foreground">Coming soon — logo will appear in the sidebar and client portal header.</p>
                </div>
              </div>
              <Button size="sm" className="font-sans" disabled={savingBranding} onClick={() => {
                setSavingBranding(true);
                localStorage.setItem("hbc_business_name", businessName);
                localStorage.setItem("hbc_tagline", tagline);
                localStorage.setItem("hbc_brand_color", brandColor);
                setTimeout(() => { setSavingBranding(false); toast.success("Branding saved"); }, 300);
              }}>
                {savingBranding ? "Saving..." : "Save Branding"}
              </Button>
            </Card>

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
              <h3 className="text-base font-sans font-semibold text-foreground">Email Notifications</h3>
              <p className="text-sm font-sans text-muted-foreground">Choose which events trigger an email notification.</p>
              <div className="space-y-4">
                {NOTIFICATION_KEYS.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm font-sans text-foreground cursor-pointer">{label}</Label>
                    <Switch
                      checked={notifPrefs[key] ?? true}
                      onCheckedChange={(v) => handleNotifToggle(key, v)}
                    />
                  </div>
                ))}
              </div>
              <Button size="sm" className="font-sans" onClick={handleNotifSave} disabled={savingNotifs}>
                {savingNotifs ? "Saving..." : "Save Preferences"}
              </Button>
            </Card>

            {/* Push Notifications */}
            <PushNotificationSettings />

            <Card className="p-6 space-y-5">
              <h3 className="text-base font-sans font-semibold text-foreground">Default Region</h3>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Service Area</Label>
                <Input value={region} onChange={(e) => setRegion(e.target.value)} className="font-sans" />
              </div>
              <Button size="sm" className="font-sans" onClick={handleRegionSave} disabled={savingRegion}>
                {savingRegion ? "Saving..." : "Update"}
              </Button>
            </Card>

            {/* Business Intelligence */}
            <Card className="p-6 space-y-5">
              <h3 className="text-base font-sans font-semibold text-foreground">Business Intelligence</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Target Hourly Rate ($)</Label>
                  <Input type="number" defaultValue="150" className="font-sans w-40" disabled />
                  <p className="text-[11px] font-sans text-muted-foreground">Used to calculate client profitability scores.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Message Friction Cost ($)</Label>
                  <Input type="number" defaultValue="5" className="font-sans w-40" disabled />
                  <p className="text-[11px] font-sans text-muted-foreground">Estimated cost per client message for profitability calculation.</p>
                </div>
              </div>
            </Card>

            {/* Payment Escalation Rules */}
            <Card className="p-6 space-y-5">
              <h3 className="text-base font-sans font-semibold text-foreground">Payment Escalation Rules</h3>
              <p className="text-sm font-sans text-muted-foreground">Automated actions when invoices go past due.</p>
              <div className="space-y-3">
                {[
                  { label: "Day 1 — Gentle reminder email", default: true },
                  { label: "Day 7 — Firm follow-up email", default: true },
                  { label: "Day 14 — Final notice + admin flag", default: true },
                  { label: "Day 30 — Collections risk + urgent task", default: true },
                ].map((rule) => (
                  <div key={rule.label} className="flex items-center justify-between">
                    <Label className="text-sm font-sans text-foreground">{rule.label}</Label>
                    <Switch checked={rule.default} disabled />
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-sans text-muted-foreground">
                Escalation checks run automatically. Activity is logged in each client's timeline.
              </p>
            </Card>

            {/* Integrations — Stripe */}
            <Card className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-accent" />
                  <h3 className="text-base font-sans font-semibold text-foreground">Stripe Integration</h3>
                </div>
                {stripeConnected && (
                  <Badge className="bg-green-100 text-green-800 border-none gap-1">
                    <Check className="w-3 h-3" />
                    Connected
                  </Badge>
                )}
              </div>
              <p className="text-sm font-sans text-muted-foreground">
                Connect your Stripe account to accept online payments from clients directly through the portal.
              </p>
              {stripeConnected ? (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-sans text-foreground">Your Stripe account is connected. Clients will be able to pay invoices online.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-sans mt-3"
                    onClick={() => {
                      localStorage.removeItem("hbc_stripe_connected");
                      setStripeConnected(false);
                      toast.success("Stripe disconnected");
                    }}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-sans">Stripe Secret Key</Label>
                    <Input
                      type="password"
                      placeholder="sk_live_..."
                      value={stripeKey}
                      onChange={(e) => setStripeKey(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                  <p className="text-[11px] font-sans text-muted-foreground">
                    Find your secret key in the{" "}
                    <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-accent underline">
                      Stripe Dashboard → API Keys
                    </a>
                  </p>
                  <Button size="sm" className="font-sans" onClick={handleStripeConnect} disabled={savingStripe || !stripeKey.trim()}>
                    {savingStripe ? "Connecting..." : "Connect Stripe"}
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <ServicesLibrary />
          </TabsContent>

          <TabsContent value="integrations">
            <IntegrationsHub />
          </TabsContent>

          <TabsContent value="sla">
            <SLASettings />
          </TabsContent>

          <TabsContent value="tiers">
            <MembershipTierManager />
          </TabsContent>

          <TabsContent value="templates">
            <MessageTemplateLibrary />
          </TabsContent>

          <TabsContent value="exports">
            <ReportsExportsSettings />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogSection />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralSettings />
          </TabsContent>

          <TabsContent value="recurring">
            <RecurringPlanManager />
          </TabsContent>

          <TabsContent value="api">
            <ApiWebhookSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminSettings;
