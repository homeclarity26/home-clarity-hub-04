import { useState, useEffect } from "react";
import { Phone, CheckCircle, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const smsEvents = [
  { key: "new_message", label: "New message from advisor" },
  { key: "report_published", label: "New report published" },
  { key: "invoice_due", label: "Invoice due tomorrow" },
  { key: "project_status", label: "Project status changed" },
  { key: "service_due", label: "Equipment service due in 7 days" },
];

const SMSNotificationSettings = () => {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subId, setSubId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await (supabase.from("sms_subscriptions" as any) as any)
        .select("*")
        .eq("user_id", user.id)
        .limit(1);
      if (data && data.length > 0) {
        const sub = data[0];
        setPhone(sub.phone_number);
        setIsVerified(sub.is_verified);
        setEvents(sub.opted_in_events_json || []);
        setSubId(sub.id);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSendCode = async () => {
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setVerifying(true);
    try {
      const { error } = await supabase.functions.invoke("send-sms-verification", {
        body: { phone, userId: user?.id },
      });
      if (error) throw error;
      setShowCodeInput(true);
      toast.success("Verification code sent!");
    } catch {
      toast.error("Failed to send verification code");
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-sms-code", {
        body: { phone, code: verificationCode, userId: user?.id },
      });
      if (error) throw error;
      if (data?.verified) {
        setIsVerified(true);
        setShowCodeInput(false);
        toast.success("Phone number verified!");
      } else {
        toast.error("Invalid code — please try again");
      }
    } catch {
      toast.error("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const toggleEvent = (key: string) => {
    setEvents(prev => prev.includes(key) ? prev.filter(e => e !== key) : [...prev, key]);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (subId) {
        await (supabase.from("sms_subscriptions" as any) as any)
          .update({ opted_in_events_json: events })
          .eq("id", subId);
      } else {
        await (supabase.from("sms_subscriptions" as any) as any).insert({
          user_id: user.id,
          phone_number: phone,
          is_verified: isVerified,
          opted_in_events_json: events,
        });
      }
      toast.success("SMS preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-4">SMS Notifications</p>
        <p className="font-sans text-sm text-muted-foreground mb-4">
          Receive text message alerts for important updates about your home.
        </p>
      </div>

      {/* Phone number */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Phone Number</label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              disabled={isVerified}
              className="w-full pl-9 pr-3 py-2 border border-input rounded-md text-sm font-sans bg-background text-foreground disabled:opacity-60"
            />
          </div>
          {isVerified ? (
            <div className="flex items-center gap-1.5 text-accent px-3">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-mono text-[10px] uppercase tracking-[0.12em]">Verified</span>
            </div>
          ) : (
            <Button onClick={handleSendCode} disabled={verifying} variant="outline" size="sm">
              {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Verify"}
            </Button>
          )}
        </div>
      </div>

      {/* Verification code input */}
      {showCodeInput && !isVerified && (
        <div className="flex gap-2">
          <input
            type="text"
            value={verificationCode}
            onChange={e => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
            maxLength={6}
            className="flex-1 px-3 py-2 border border-input rounded-md text-sm font-sans bg-background text-foreground text-center tracking-[0.3em]"
          />
          <Button onClick={handleVerifyCode} disabled={verifying} size="sm">
            {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm"}
          </Button>
        </div>
      )}

      {/* Event toggles */}
      {isVerified && (
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3 block">Alert Preferences</label>
          <div className="space-y-3">
            {smsEvents.map(ev => (
              <label key={ev.key} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={events.includes(ev.key)}
                  onCheckedChange={() => toggleEvent(ev.key)}
                />
                <span className="font-sans text-sm text-foreground">{ev.label}</span>
              </label>
            ))}
          </div>

          <Button onClick={handleSave} disabled={saving} className="mt-4 w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Preferences
          </Button>
        </div>
      )}
    </div>
  );
};

export default SMSNotificationSettings;
