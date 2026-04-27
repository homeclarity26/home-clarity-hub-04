import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Palette, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PortalPersonalizationProps {
  propertyId: string;
}

const PortalPersonalization = ({ propertyId }: PortalPersonalizationProps) => {
  const [form, setForm] = useState({ welcome_message: "", tagline: "", hero_photo_url: "", advisor_signature: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("portal_customizations")
        .select("*")
        .eq("property_id", propertyId)
        .limit(1);
      if (data && data.length > 0) {
        const d = data[0];
        setExistingId(d.id);
        setForm({
          welcome_message: d.welcome_message || "",
          tagline: d.tagline || "",
          hero_photo_url: d.hero_photo_url || "",
          advisor_signature: d.advisor_signature || "",
        });
      }
      setLoading(false);
    };
    load();
  }, [propertyId]);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      property_id: propertyId,
      welcome_message: form.welcome_message || null,
      tagline: form.tagline || null,
      hero_photo_url: form.hero_photo_url || null,
      advisor_signature: form.advisor_signature || null,
    };
    if (existingId) {
      const { error } = await supabase.from("portal_customizations").update(payload).eq("id", existingId);
      if (error) { toast.error("Failed to save"); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from("portal_customizations").insert(payload).select().single();
      if (error) { toast.error("Failed to save"); setSaving(false); return; }
      if (data) setExistingId(data.id);
    }
    toast.success("Portal personalization saved");
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-sans font-semibold text-foreground">Portal Personalization</h3>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="font-sans text-xs text-muted-foreground">Custom Welcome Message</Label>
          <Input value={form.welcome_message} onChange={(e) => setForm({ ...form, welcome_message: e.target.value })} placeholder="Welcome home, Johnson family" />
        </div>
        <div>
          <Label className="font-sans text-xs text-muted-foreground">Portal Tagline</Label>
          <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="The Johnson Family's Home Command Center" />
        </div>
        <div>
          <Label className="font-sans text-xs text-muted-foreground">Hero Photo URL</Label>
          <Input value={form.hero_photo_url} onChange={(e) => setForm({ ...form, hero_photo_url: e.target.value })} placeholder="https://..." />
        </div>
        <div>
          <Label className="font-sans text-xs text-muted-foreground">Advisor Signature</Label>
          <Textarea value={form.advisor_signature} onChange={(e) => setForm({ ...form, advisor_signature: e.target.value })} placeholder="It's our privilege to be your home advisor. - Adam" rows={2} />
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5 font-sans">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Personalization
        </Button>
      </div>
    </Card>
  );
};

export default PortalPersonalization;
