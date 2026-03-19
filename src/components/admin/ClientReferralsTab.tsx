import { useState, useEffect } from "react";
import { Gift, Copy, CheckCircle2, Share2, Users, DollarSign, Clock, Link as LinkIcon, QrCode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  propertyId: string;
  clientId: string;
}

const ClientReferralsTab = ({ propertyId, clientId }: Props) => {
  const { user } = useAuth();
  const [link, setLink] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedCreditId, setSelectedCreditId] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

  const load = async () => {
    setLoading(true);

    // Get or create referral link
    const { data: existingLink } = await (supabase.from("referral_links") as any)
      .select("*").eq("client_id", clientId).eq("property_id", propertyId).maybeSingle();

    if (existingLink) {
      setLink(existingLink);
    } else {
      const code = `HBC-${clientId.slice(0, 4).toUpperCase()}${Date.now().toString(36).slice(-4).toUpperCase()}`;
      const url = `${window.location.origin}/refer/${code}`;
      const { data: newLink } = await (supabase.from("referral_links") as any)
        .insert({ property_id: propertyId, client_id: clientId, referral_code: code, referral_url: url })
        .select("*").single();
      setLink(newLink);
    }

    // Load events for this referral code
    if (existingLink?.referral_code) {
      const { data: evts } = await (supabase.from("referral_events") as any)
        .select("*").eq("referral_code", existingLink.referral_code).order("created_at", { ascending: false });
      setEvents(evts || []);
    }

    // Load credits
    const { data: creds } = await (supabase.from("referral_credits") as any)
      .select("*").eq("property_id", propertyId).order("created_at", { ascending: false });
    setCredits(creds || []);

    // Load open invoices
    const { data: invs } = await supabase.from("invoices")
      .select("id, title, amount, status").eq("property_id", propertyId).neq("status", "paid");
    setInvoices(invs || []);

    setLoading(false);
  };

  useEffect(() => { load(); }, [propertyId, clientId]);

  const availableCredits = credits.filter(c => c.status === "available");
  const totalEarned = credits.reduce((s, c) => s + (c.amount_cents || 0), 0);
  const availableBalance = availableCredits.reduce((s, c) => s + (c.amount_cents || 0), 0);
  const converted = events.filter(e => e.status === "converted").length;

  const handleCopy = () => {
    if (!link) return;
    navigator.clipboard.writeText(link.referral_url || `${window.location.origin}/refer/${link.referral_code}`);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyCredit = async () => {
    if (!selectedCreditId || !selectedInvoiceId) return;
    await (supabase.from("referral_credits") as any)
      .update({ status: "applied", applied_to_invoice_id: selectedInvoiceId, applied_at: new Date().toISOString() })
      .eq("id", selectedCreditId);
    toast.success("Credit applied to invoice");
    setApplyOpen(false);
    load();
  };

  const statusColor = (s: string) => {
    if (s === "converted") return "bg-green-100 text-green-800";
    if (s === "signed_up") return "bg-blue-100 text-blue-800";
    return "bg-muted text-muted-foreground";
  };

  const creditStatusColor = (s: string) => {
    if (s === "available") return "bg-green-100 text-green-800";
    if (s === "applied") return "bg-blue-100 text-blue-800";
    if (s === "expired") return "bg-destructive/10 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading referrals...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Referral Link */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-accent" />
          <h3 className="text-base font-sans font-semibold text-foreground">Referral Link</h3>
        </div>
        <div className="flex gap-2">
          <Input
            value={link?.referral_url || `${window.location.origin}/refer/${link?.referral_code}`}
            readOnly
            className="font-mono text-xs bg-muted"
          />
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 shrink-0 font-sans text-xs">
            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <QrCode className="w-4 h-4" />
          <span className="font-mono text-[10px] uppercase tracking-wide">Code: {link?.referral_code}</span>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <div>
              <p className="text-xl font-bold text-foreground">{events.length}</p>
              <p className="text-[10px] text-muted-foreground">Referrals Sent</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-accent" />
            <div>
              <p className="text-xl font-bold text-foreground">{converted}</p>
              <p className="text-[10px] text-muted-foreground">Converted</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-xl font-bold text-foreground">${(totalEarned / 100).toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground">Total Earned</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-accent" />
            <div>
              <p className="text-xl font-bold text-foreground">${(availableBalance / 100).toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground">Available Credit</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Apply Credit */}
      {availableCredits.length > 0 && invoices.length > 0 && (
        <Button variant="outline" size="sm" className="font-sans gap-1.5" onClick={() => setApplyOpen(true)}>
          <DollarSign className="w-3.5 h-3.5" /> Apply Credit to Invoice
        </Button>
      )}

      {/* Credits Ledger */}
      <Card className="p-5 space-y-3">
        <h4 className="text-sm font-sans font-semibold text-foreground">Credits Ledger</h4>
        {credits.length === 0 ? (
          <p className="text-xs text-muted-foreground">No credits earned yet.</p>
        ) : (
          <div className="space-y-2">
            {credits.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-sans text-foreground">${(c.amount_cents / 100).toFixed(0)} — {c.reason}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(c.created_at), "MMM d, yyyy")}
                    {c.expires_at && ` · Expires ${format(new Date(c.expires_at), "MMM d, yyyy")}`}
                  </p>
                </div>
                <Badge className={`text-[10px] ${creditStatusColor(c.status)}`}>{c.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Referral History */}
      <Card className="p-5 space-y-3">
        <h4 className="text-sm font-sans font-semibold text-foreground">Referral History</h4>
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground">No referral events yet.</p>
        ) : (
          <div className="space-y-2">
            {events.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-sans text-foreground">{e.referred_name || e.referred_email || "Anonymous"}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(e.created_at), "MMM d, yyyy h:mm a")}</p>
                </div>
                <Badge className={`text-[10px] ${statusColor(e.status)}`}>{e.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Apply Credit Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply Credit to Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-sans mb-2">Select Credit</p>
              <Select value={selectedCreditId} onValueChange={setSelectedCreditId}>
                <SelectTrigger><SelectValue placeholder="Choose credit" /></SelectTrigger>
                <SelectContent>
                  {availableCredits.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      ${(c.amount_cents / 100).toFixed(0)} — {c.reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm font-sans mb-2">Select Invoice</p>
              <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                <SelectTrigger><SelectValue placeholder="Choose invoice" /></SelectTrigger>
                <SelectContent>
                  {invoices.map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.title} — ${i.amount}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleApplyCredit} disabled={!selectedCreditId || !selectedInvoiceId} className="w-full font-sans">
              Apply Credit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shareable Messages */}
      <Card className="p-5 space-y-3">
        <h4 className="text-sm font-sans font-semibold text-foreground">Share Messages</h4>
        <p className="text-xs text-muted-foreground">Copy and paste these messages to share your referral link:</p>
        {[
          `Hey! I use Home Clarity Hub to keep my home in great shape. Check it out: ${link?.referral_url || ""}`,
          `I've been loving the home stewardship service from HBC. If you sign up using my link, we both benefit! ${link?.referral_url || ""}`,
        ].map((msg, i) => (
          <div key={i} className="bg-muted rounded-lg p-3 flex items-start gap-2">
            <p className="text-xs font-sans text-foreground flex-1">{msg}</p>
            <Button variant="ghost" size="sm" className="shrink-0 h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(msg); toast.success("Copied!"); }}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
};

export default ClientReferralsTab;
