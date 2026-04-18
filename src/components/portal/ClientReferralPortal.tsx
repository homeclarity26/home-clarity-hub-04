import { useState, useEffect } from "react";
import { Gift, Copy, CheckCircle2, Share2, Users, DollarSign, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  propertyId?: string;
}

const ClientReferralPortal = ({ propertyId }: Props) => {
  const { user } = useAuth();
  const [link, setLink] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const creditPerReferral = 50; // $50

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Get or create referral link
      const { data: existing } = await supabase.from("referral_links")
        .select("*").eq("client_id", user.id).limit(1).maybeSingle();

      if (existing) {
        setLink(existing);
        // Load events
        const { data: evts } = await supabase.from("referral_events")
          .select("*").eq("referral_code", existing.referral_code).order("created_at", { ascending: false });
        setEvents(evts || []);
      } else if (propertyId) {
        const code = `HBC-${user.id.slice(0, 4).toUpperCase()}${Date.now().toString(36).slice(-4).toUpperCase()}`;
        const url = `${window.location.origin}/refer/${code}`;
        const { data: newLink } = await supabase.from("referral_links")
          .insert({ property_id: propertyId, client_id: user.id, referral_code: code, referral_url: url })
          .select("*").single();
        setLink(newLink);
      }

      // Load credits
      if (propertyId) {
        const { data: creds } = await supabase.from("referral_credits")
          .select("*").eq("property_id", propertyId).order("created_at", { ascending: false });
        setCredits(creds || []);
      }

      setLoading(false);
    };
    load();
  }, [user, propertyId]);

  const availableBalance = credits.filter(c => c.status === "available").reduce((s, c) => s + (c.amount_cents || 0), 0);
  const totalEarned = credits.reduce((s, c) => s + (c.amount_cents || 0), 0);
  const converted = events.filter(e => e.status === "converted").length;

  const handleCopy = () => {
    if (!link) return;
    const url = link.referral_url || `${window.location.origin}/refer/${link.referral_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = link?.referral_url || "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Home Clarity Hub",
          text: `I use Home Clarity Hub to manage my home — check it out and we both benefit!`,
          url,
        });
      } catch { /* cancelled */ }
    } else {
      handleCopy();
    }
  };

  const statusColor = (s: string) => {
    if (s === "converted") return "bg-green-100 text-green-800";
    if (s === "signed_up") return "bg-blue-100 text-blue-800";
    return "bg-muted text-muted-foreground";
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-20">
      <section className="text-center py-10 md:py-12 max-w-3xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-accent" />
        </div>
        <h1 className="font-display text-3xl md:text-[36px] text-foreground mb-3">
          Share HBC with a Friend — Earn ${creditPerReferral} Credit
        </h1>
        <p className="font-sans text-base text-muted-foreground max-w-lg mx-auto">
          Know a homeowner who could benefit from professional home stewardship? Share your referral link and earn credit when they join.
        </p>
      </section>

      <div className="max-w-2xl mx-auto space-y-6 pb-16">
        {/* Referral Link Card */}
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-sans font-semibold text-foreground">Your Referral Link</h3>
          <p className="font-mono text-xs text-muted-foreground bg-muted px-3 py-2 rounded truncate">
            {link?.referral_url || `${window.location.origin}/refer/${link?.referral_code}`}
          </p>
          <Button variant="outline" size="sm" className="gap-1.5 font-sans text-xs" onClick={handleShare}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
        </Card>

        {/* How it works */}
        <Card className="p-6">
          <h3 className="text-base font-sans font-semibold text-foreground mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: ExternalLink, title: "1. Share your link", desc: "Send your unique referral link to a friend who owns a home." },
              { icon: Users, title: "2. Friend joins HBC", desc: "When they sign up and complete onboarding, the referral is confirmed." },
              { icon: Gift, title: `3. Earn $${creditPerReferral} credit`, desc: "You'll receive credit that can be applied to any future invoice." },
            ].map((step, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                  <step.icon className="w-5 h-5 text-accent" />
                </div>
                <p className="text-sm font-sans font-medium text-foreground">{step.title}</p>
                <p className="text-sm font-sans text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{events.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Referrals</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{converted}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Converted</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">${(availableBalance / 100).toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Available Credit</p>
          </Card>
        </div>

        {/* Referral History */}
        {events.length > 0 && (
          <Card className="p-6 space-y-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between text-sm font-sans font-semibold text-foreground bg-transparent border-none cursor-pointer p-0"
            >
              Referral History
              <Badge variant="secondary">{events.length}</Badge>
            </button>
            {showHistory && (
              <div className="space-y-2 pt-2">
                {events.map(e => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-sans text-foreground">{e.referred_name || e.referred_email || "Someone"}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(e.created_at), "MMM d, yyyy")}</p>
                    </div>
                    <Badge className={`text-[10px] ${statusColor(e.status)}`}>{e.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Share snippets */}
        <Card className="p-6 space-y-3">
          <h3 className="text-base font-sans font-semibold text-foreground">Share Message</h3>
          <p className="text-xs font-sans text-muted-foreground">Copy and send this message to friends:</p>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm font-sans text-foreground mb-3">
              "Hey! I use Home Clarity Hub to keep my home in great shape — it's like having a personal advisor for my house. Check it out using my link: {link?.referral_url || ""}"
            </p>
            <Button variant="outline" size="sm" className="gap-1.5 font-sans text-xs" onClick={() => {
              navigator.clipboard.writeText(`Hey! I use Home Clarity Hub to keep my home in great shape — it's like having a personal advisor for my house. Check it out using my link: ${link?.referral_url || ""}`);
              toast.success("Message copied!");
            }}>
              <Copy className="w-3 h-3" /> Copy Message
            </Button>
          </div>
        </Card>

        <p className="text-center text-[10px] font-sans text-muted-foreground">
          Credits are issued when your referral completes onboarding. Credits can be applied to any open invoice.
        </p>
      </div>
    </div>
  );
};

export default ClientReferralPortal;
