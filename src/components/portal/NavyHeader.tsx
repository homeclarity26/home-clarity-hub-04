import { ArrowLeft } from "lucide-react";

interface NavyHeaderProps {
  backLabel?: string;
  onBack?: () => void;
  eyebrow?: string;
  title: string;
  className?: string;
}

/**
 * HCR navy section header — navy background, gold rule, CG display title.
 * Used on every interior screen so the brand stays cohesive.
 */
const NavyHeader = ({
  backLabel,
  onBack,
  eyebrow,
  title,
  className = "",
}: NavyHeaderProps) => {
  return (
    <div
      className={`bg-primary text-primary-foreground px-6 md:px-10 pt-8 pb-8 ${className}`}
    >
      <div className="max-w-[1040px] mx-auto">
        {backLabel && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.14em] font-semibold text-primary-foreground/55 hover:text-accent transition-colors mb-5 bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            {backLabel}
          </button>
        )}
        <div className="w-10 h-[2px] bg-accent rounded-[1px] mb-4" />
        {eyebrow && (
          <p className="font-sans text-[10px] uppercase tracking-[0.18em] font-semibold text-primary-foreground/55 mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[28px] md:text-[34px] lg:text-[44px] text-primary-foreground font-semibold leading-[1.08]">
          {title}
        </h1>
      </div>
    </div>
  );
};

export default NavyHeader;
