import type { ReportPageData } from "@/data/reportContent";
import HealthBar from "./HealthBar";
import PricingTiers from "./PricingTiers";

interface ReportPageProps {
  page: ReportPageData;
}

const conditionColors: Record<string, string> = {
  Excellent: "text-green-600",
  Good: "text-foreground",
  Fair: "text-accent",
  Poor: "text-orange-600",
  Critical: "text-destructive",
};

const ReportPage = ({ page }: ReportPageProps) => {
  return (
    <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 md:py-24">
      <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
        {page.title}
      </h2>

      {page.conditionRating && (
        <p className={`font-mono text-[11px] uppercase tracking-[0.15em] mb-10 ${conditionColors[page.conditionRating]}`}>
          Condition: {page.conditionRating}
        </p>
      )}

      {page.narrative.map((paragraph, i) => (
        <p key={i} className="text-base text-foreground max-w-[65ch] mb-6 leading-relaxed">
          {paragraph}
        </p>
      ))}

      {page.healthBar && <HealthBar {...page.healthBar} />}

      {page.specs && page.specs.length > 0 && (
        <div className="mt-12">
          <h3 className="font-display text-2xl text-foreground mb-6">System Specifications</h3>
          <div className="space-y-3">
            {page.specs.map((spec, i) => (
              <div key={i} className="flex justify-between border-b border-border py-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  {spec.label}
                </span>
                <span className="text-sm text-foreground">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {page.tiers && (
        <div className="mt-12">
          <h3 className="font-display text-2xl text-foreground mb-6">Investment Options</h3>
          <PricingTiers tiers={page.tiers} />
        </div>
      )}

      {page.timing && (
        <div className="mt-8">
          <h3 className="font-display text-2xl text-foreground mb-4">Strategic Timing</h3>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-accent">
            {page.timing}
          </p>
        </div>
      )}

      {page.recommendations && page.recommendations.length > 0 && (
        <div className="mt-12">
          <h3 className="font-display text-2xl text-foreground mb-6">Recommendations</h3>
          <ul className="space-y-3">
            {page.recommendations.map((rec, i) => (
              <li key={i} className="text-base text-foreground pl-4 border-l-2 border-accent py-1">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReportPage;
