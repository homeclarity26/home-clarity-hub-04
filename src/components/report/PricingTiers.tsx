import { useState } from "react";
import type { TierData } from "@/data/reportContent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, CheckCircle } from "lucide-react";
import { useEditMode } from "@/contexts/EditModeContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PricingTiersProps {
  tiers: { essential: TierData; enhanced: TierData; signature: TierData };
  pageTitle?: string;
  propertyId?: string;
  onTabChange?: (tab: string) => void;
}

const tierKeys = ["essential", "enhanced", "signature"] as const;
const tierLabels: Record<string, string> = { essential: "Essential", enhanced: "Enhanced", signature: "Signature" };

function parseCost(price: string): number | null {
  const cleaned = price.replace(/[^0-9.,–-]/g, "");
  const first = cleaned.split(/[–-]/)[0].replace(/,/g, "");
  const num = parseFloat(first);
  return isNaN(num) ? null : num;
}

const PricingTiers = ({ tiers, pageTitle, propertyId, onTabChange }: PricingTiersProps) => {
  const { canEdit } = useEditMode();
  const [creating, setCreating] = useState<string | null>(null);
  const [confirmTier, setConfirmTier] = useState<string | null>(null);

  const handleApprove = async (tierKey: string) => {
    if (!propertyId) return;
    const tier = tiers[tierKey as keyof typeof tiers];
    const label = tierLabels[tierKey];

    setCreating(tierKey);
    setConfirmTier(null);
    try {
      const cost = parseCost(tier.price);

      // Create project
      const { error: projError } = await supabase.from("projects").insert({
        property_id: propertyId,
        title: `${pageTitle || "Project"}: ${label}`,
        description: tier.description,
        estimated_cost: cost,
        approved_tier: label,
        status: "planned",
      });
      if (projError) throw projError;

      // Create draft invoice
      if (cost && cost > 0) {
        await supabase.from("invoices").insert({
          property_id: propertyId,
          description: `${pageTitle || "Project"}: ${label} Tier`,
          amount: cost,
          total: cost,
          subtotal: cost,
          balance_due: cost,
          status: "pending",
          type: "invoice",
        });
      }

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("activity_log").insert({
        property_id: propertyId,
        user_id: user?.id,
        action_type: "approval",
        message: `Client approved ${label} tier for ${pageTitle || "project"}`,
        metadata: { tier: label, cost, page_title: pageTitle },
      });

      toast.success(`${label} tier approved! Project & invoice created.`, {
        action: onTabChange
          ? { label: "View Projects", onClick: () => onTabChange("projects") }
          : undefined,
      });
    } catch (err) {
      console.error("Approve tier failed:", err);
      toast.error("Failed to approve tier.");
    } finally {
      setCreating(null);
    }
  };

  const borderStyles = {
    essential: "",
    enhanced: "border-t-2 border-foreground",
    signature: "border-t-2 border-accent",
  };

  const selectedTier = confirmTier ? tiers[confirmTier as keyof typeof tiers] : null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
        {tierKeys.map((key) => {
          const tier = tiers[key];
          return (
            <div
              key={key}
              className={`bg-card shadow-hbc-sm rounded-lg p-8 text-center transition-transform hover:-translate-y-0.5 hover:shadow-hbc-md ${borderStyles[key]}`}
            >
              <h4 className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
                {tierLabels[key]}
              </h4>
              <p className="font-display text-3xl text-foreground mb-4">{tier.price}</p>
              <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>

              {propertyId && !canEdit && (
                <button
                  onClick={() => setConfirmTier(key)}
                  disabled={creating === key}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-accent/30 bg-card hover:bg-accent/5 text-xs font-mono uppercase tracking-wider text-accent hover:text-accent transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {creating === key ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  Approve This Tier
                </button>
              )}

              {propertyId && canEdit && (
                <button
                  onClick={() => handleApprove(key)}
                  disabled={creating === key}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border bg-card hover:bg-muted/50 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {creating === key ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Create Project
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Approval Confirmation Modal */}
      <Dialog open={!!confirmTier} onOpenChange={(open) => !open && setConfirmTier(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Approve {confirmTier ? tierLabels[confirmTier] : ""} Tier
            </DialogTitle>
            <DialogDescription className="font-sans text-sm">
              By approving, a project and draft invoice will be created for this tier.
            </DialogDescription>
          </DialogHeader>

          {selectedTier && (
            <div className="space-y-3 py-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  {pageTitle || "Project"}
                </p>
                <p className="font-display text-2xl text-foreground">{selectedTier.price}</p>
              </div>
              <p className="text-sm font-sans text-muted-foreground">{selectedTier.description}</p>
              <div className="bg-accent/5 rounded-md p-3 border border-accent/20">
                <p className="text-xs font-sans text-accent">
                  ✓ A project will be added to your Projects tab<br />
                  ✓ A draft invoice will be created for this amount<br />
                  ✓ Your advisor will be notified of your approval
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmTier(null)} className="font-sans">
              Cancel
            </Button>
            <Button
              onClick={() => confirmTier && handleApprove(confirmTier)}
              disabled={!!creating}
              className="font-sans gap-1.5"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PricingTiers;
