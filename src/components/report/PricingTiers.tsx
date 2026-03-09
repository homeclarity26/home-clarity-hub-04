import type { TierData } from "@/data/reportContent";

interface PricingTiersProps {
  tiers: { essential: TierData; enhanced: TierData; signature: TierData };
}

const PricingTiers = ({ tiers }: PricingTiersProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
      <div className="bg-card shadow-hbc-sm rounded-lg p-8 text-center transition-transform hover:-translate-y-0.5 hover:shadow-hbc-md">
        <h4 className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
          Essential
        </h4>
        <p className="font-display text-3xl text-foreground mb-4">{tiers.essential.price}</p>
        <p className="text-sm text-muted-foreground">{tiers.essential.description}</p>
      </div>
      <div className="bg-card shadow-hbc-sm rounded-lg p-8 text-center border-t-2 border-foreground transition-transform hover:-translate-y-0.5 hover:shadow-hbc-md">
        <h4 className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
          Enhanced
        </h4>
        <p className="font-display text-3xl text-foreground mb-4">{tiers.enhanced.price}</p>
        <p className="text-sm text-muted-foreground">{tiers.enhanced.description}</p>
      </div>
      <div className="bg-card shadow-hbc-sm rounded-lg p-8 text-center border-t-2 border-accent transition-transform hover:-translate-y-0.5 hover:shadow-hbc-md">
        <h4 className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-4">
          Signature
        </h4>
        <p className="font-display text-3xl text-foreground mb-4">{tiers.signature.price}</p>
        <p className="text-sm text-muted-foreground">{tiers.signature.description}</p>
      </div>
    </div>
  );
};

export default PricingTiers;
