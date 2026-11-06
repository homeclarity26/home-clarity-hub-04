import { PropertyHero } from "@/components/portal/PropertyHero";

interface PortalHomeHeroProps {
  propertyName: string;
  propertyAddress?: string;
  heroImageUrl?: string | null;
  yearBuilt?: number | null;
  firstName?: string;
}

// Prototype screen 21: the Portal Home hero eyebrow is the fixed
// "WELCOME HOME" label (gold mono), not a time-of-day greeting, and the
// family name stands alone without a first-name suffix.
export function PortalHomeHero(props: PortalHomeHeroProps) {
  return (
    <PropertyHero
      propertyName={props.propertyName}
      propertyAddress={props.propertyAddress}
      heroImageUrl={props.heroImageUrl}
      yearBuilt={props.yearBuilt}
      greeting="Welcome home"
    />
  );
}

export default PortalHomeHero;
