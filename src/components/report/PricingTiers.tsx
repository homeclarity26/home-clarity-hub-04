import { useState } from "react";
import type { TierData } from "@/data/reportContent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { useEditMode } from "@/contexts/EditModeContext";

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

  const handleCreateProject = async (tierKey: string) => {
    if (!propertyId) return;
    const tier = tiers[tierKey as keyof typeof tiers];
    const label = tierLabels[tierKey];

    setCreating(tierKey);
    try {
      const cost = parseCost(tier.price);
      const { error } = await supabase.from("projects").insert({
        property_id: propertyId,
        title: `${pageTitle || "Project"} — ${label}`,
        description: tier.description,
        estimated_cost: cost,
        approved_tier: label,
        status: "planned",
      });

      if (error) throw error;
      toast.success(`Project created: ${pageTitle} — ${label}`, {
        action: onTabChange
          ? { label: "View Projects", onClick: () => onTabChange("projects") }
          : undefined,
      });
    } catch (err) {
      console.error("Create project failed:", err);
      toast.error("Failed to create project.");
    } finally {
      setCreating(null);
    }
  };

  const borderStyles = {
    essential: "",
    enhanced: "border-t-2 border-foreground",
    signature: "border-t-2 border-accent",
  };

  return (
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
                onClick={() => handleCreateProject(key)}
                disabled={creating === key}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border bg-card hover:bg-muted/50 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
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
  );
};

export default PricingTiers;
