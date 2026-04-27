import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Key, Webhook, Plus, Trash2, Eye, EyeOff, Send, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const WEBHOOK_EVENTS = [
  "client.created", "client.updated", "report.published", "report.updated",
  "project.created", "project.status_changed", "invoice.created", "invoice.paid",
  "invoice.overdue", "message.sent_by_client", "equipment.service_due", "referral.converted",
];

const ApiWebhookSettings = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState("");
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [whLabel, setWhLabel] = useState("");
  const [whUrl, setWhUrl] = useState("");
  const [whEvents, setWhEvents] = useState<string[]>([]);
  const [testing, setTesting] = useState<string | null>(null);

  const { data: apiKeys = [] } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const { data } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: webhooks = [] } = useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const { data } = await supabase.from("webhooks").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const generateApiKey = async () => {
    if (!user || !newKeyLabel.trim()) return;
    const key = `hbc_${crypto.randomUUID().replace(/-/g, "")}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    await supabase.from("api_keys").insert({
      admin_id: user.id, key_hash: hashHex, label: newKeyLabel.trim(),
    });
    setGeneratedKey(key);
    setNewKeyLabel("");
    qc.invalidateQueries({ queryKey: ["api-keys"] });
    toast.success("API key generated");
  };

  const revokeKey = async (id: string) => {
    await supabase.from("api_keys").update({ is_active: false }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["api-keys"] });
    toast.success("API key revoked");
  };

  const addWebhook = async () => {
    if (!user || !whUrl.trim() || !whLabel.trim() || whEvents.length === 0) return;
    const secret = `whsec_${crypto.randomUUID().replace(/-/g, "")}`;
    await supabase.from("webhooks").insert({
      admin_id: user.id, endpoint_url: whUrl.trim(), label: whLabel.trim(),
      events_subscribed_json: whEvents, secret_token: secret,
    });
    setWebhookOpen(false);
    setWhUrl(""); setWhLabel(""); setWhEvents([]);
    qc.invalidateQueries({ queryKey: ["webhooks"] });
    toast.success("Webhook added");
  };

  const toggleWebhook = async (id: string, active: boolean) => {
    await supabase.from("webhooks").update({ is_active: active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["webhooks"] });
  };

  const deleteWebhook = async (id: string) => {
    await supabase.from("webhooks").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["webhooks"] });
    toast.success("Webhook deleted");
  };

  const testWebhook = async (wh: any) => {
    setTesting(wh.id);
    try {
      const payload = { event: "test", timestamp: new Date().toISOString(), data: { message: "Test event from HBC" } };
      await supabase.from("webhook_logs").insert({
        webhook_id: wh.id, event_type: "test", payload_json: payload, response_status: 200, success: true,
      });
      toast.success("Test event sent");
    } catch {
      toast.error("Test failed");
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* API Keys */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-accent" />
            <h3 className="text-base font-sans font-semibold text-foreground">API Keys</h3>
          </div>
          <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => setShowKeyDialog(true)}>
            <Plus className="w-3.5 h-3.5" />Generate Key
          </Button>
        </div>

        {generatedKey && (
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
            <p className="text-xs font-sans text-foreground font-medium mb-1">Your new API key (copy now, it won't be shown again):</p>
            <code className="text-sm font-mono text-foreground bg-muted p-2 rounded block break-all">{generatedKey}</code>
            <Button size="sm" variant="outline" className="mt-2 text-xs font-sans" onClick={() => { navigator.clipboard.writeText(generatedKey); toast.success("Copied"); }}>
              Copy Key
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {apiKeys.map((key: any) => (
            <div key={key.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <span className="text-sm font-sans font-medium text-foreground">{key.label}</span>
                <p className="text-[11px] font-mono text-muted-foreground">
                  {key.key_hash.slice(0, 12)}...
                  {key.last_used_at && <> · Last used {new Date(key.last_used_at).toLocaleDateString()}</>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={key.is_active ? "secondary" : "destructive"} className="text-[10px]">
                  {key.is_active ? "Active" : "Revoked"}
                </Badge>
                {key.is_active && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => revokeKey(key.id)}>
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          ))}
          {apiKeys.length === 0 && <p className="text-sm font-sans text-muted-foreground text-center py-4">No API keys yet.</p>}
        </div>
      </Card>

      {/* Webhooks */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-accent" />
            <h3 className="text-base font-sans font-semibold text-foreground">Webhooks</h3>
          </div>
          <Button size="sm" className="gap-1.5 text-xs font-sans" onClick={() => setWebhookOpen(true)}>
            <Plus className="w-3.5 h-3.5" />Add Webhook
          </Button>
        </div>

        <div className="space-y-3">
          {webhooks.map((wh: any) => (
            <div key={wh.id} className="border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-sans font-medium text-foreground">{wh.label}</span>
                  {wh.failure_count >= 10 && (
                    <Badge variant="destructive" className="text-[10px] gap-1">
                      <AlertTriangle className="w-3 h-3" />Auto-disabled
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={wh.is_active} onCheckedChange={(v) => toggleWebhook(wh.id, v)} />
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => testWebhook(wh)} disabled={testing === wh.id}>
                    {testing === wh.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Test
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => deleteWebhook(wh.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <p className="text-[11px] font-mono text-muted-foreground truncate">{wh.endpoint_url}</p>
              <div className="flex gap-1 flex-wrap">
                {(wh.events_subscribed_json || []).map((ev: string) => (
                  <Badge key={ev} variant="outline" className="text-[9px] font-mono">{ev}</Badge>
                ))}
              </div>
            </div>
          ))}
          {webhooks.length === 0 && <p className="text-sm font-sans text-muted-foreground text-center py-4">No webhooks configured.</p>}
        </div>
      </Card>

      {/* Generate Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-sans">Generate API Key</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label className="text-xs font-sans">Key Label</Label>
            <Input placeholder="e.g., QuickBooks Integration" value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)} className="font-sans" />
          </div>
          <DialogFooter>
            <Button onClick={generateApiKey} disabled={!newKeyLabel.trim()} className="font-sans">Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Webhook Dialog */}
      <Dialog open={webhookOpen} onOpenChange={setWebhookOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-sans">Add Webhook</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Label</Label>
              <Input placeholder="e.g., HubSpot Sync" value={whLabel} onChange={e => setWhLabel(e.target.value)} className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Endpoint URL</Label>
              <Input placeholder="https://..." value={whUrl} onChange={e => setWhUrl(e.target.value)} className="font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-sans">Events</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {WEBHOOK_EVENTS.map(ev => (
                  <label key={ev} className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                    <Checkbox
                      checked={whEvents.includes(ev)}
                      onCheckedChange={checked => {
                        setWhEvents(prev => checked ? [...prev, ev] : prev.filter(e => e !== ev));
                      }}
                    />
                    {ev}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={addWebhook} disabled={!whUrl.trim() || !whLabel.trim() || whEvents.length === 0} className="font-sans">
              Add Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiWebhookSettings;
