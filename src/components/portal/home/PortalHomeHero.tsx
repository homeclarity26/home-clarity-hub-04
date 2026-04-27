import { PropertyHero } from "@/components/portal/PropertyHero";

interface PortalHomeHeroProps {
  propertyName: string;
  propertyAddress?: string;
  heroImageUrl?: string | null;
  yearBuilt?: number | null;
  firstName?: string;
}

export function PortalHomeHero(props: PortalHomeHeroProps) {
  return <PropertyHero {...props} />;
}

export default PortalHomeHero;
