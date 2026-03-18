import { useState } from "react";
import { Gift, Copy, CheckCircle2, Share2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const ClientReferralPortal = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = user?.id ? user.id.slice(0, 8).toUpperCase() : "HBC00000";
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Home Clarity Hub",
          text: "I use Home Clarity Hub to manage my home — check it out!",
          url: referralLink,
        });
      } catch { /* cancelled */ }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Referral Program</p>
      <div className="bg-card rounded-lg border border-border shadow-hbc-sm p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="font-display text-lg text-foreground mb-1">Share the Clarity</h3>
            <p className="font-sans text-sm text-muted-foreground">
              Know a homeowner who could benefit? Share your referral link and both of you get a complimentary maintenance consultation.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Input value={referralLink} readOnly className="font-mono text-xs bg-muted" />
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0 font-sans text-xs" onClick={handleCopy}>
            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 font-sans text-xs" onClick={handleShare}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em]">Your referral code: {referralCode}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientReferralPortal;
