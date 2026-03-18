import { HelpCircle } from "lucide-react";
import { useTutorialProgress } from "@/hooks/useTutorialProgress";

interface HelpFloatingButtonProps {
  onClick: () => void;
}

const HelpFloatingButton = ({ onClick }: HelpFloatingButtonProps) => {
  const { progress } = useTutorialProgress();
  const showPulse = !progress?.onboarding_complete;

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-50 w-[52px] h-[52px] rounded-full bg-primary text-accent flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 border-none cursor-pointer ${
        showPulse ? "animate-pulse" : ""
      }`}
      style={{
        boxShadow: "0 4px 20px hsl(221 47% 20% / 0.3)",
      }}
      aria-label="Open Help Center"
    >
      <HelpCircle className="w-6 h-6" />
    </button>
  );
};

export default HelpFloatingButton;
