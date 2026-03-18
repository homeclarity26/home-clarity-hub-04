import { useState } from "react";
import { FileText, Wrench, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTutorialProgress } from "@/hooks/useTutorialProgress";

interface ClientOnboardingModalProps {
  onComplete: (navigateTo?: string) => void;
}

const steps = [
  {
    title: "Welcome to Your Home Clarity Hub Portal",
    subtitle: "Your personalized home stewardship system.",
    body: "Everything you need to understand, maintain, and improve your home lives here. Your advisor has built this portal specifically for you and your property.",
    icon: null,
    button: "Get Started →",
  },
  {
    title: "Your Home Clarity Report",
    body: "At the heart of your portal is your Home Clarity Report — a chapter-by-chapter assessment of your home's condition. It includes your Home Health Score, condition ratings for every major system, Priority Action Items, and a multi-year Strategic Plan built just for your home.",
    icon: FileText,
    button: "Next →",
  },
  {
    title: "Projects, Schedule & Equipment",
    body: "Your advisor creates projects directly tied to your report findings. Track their status, see estimated costs, and follow along as work is completed. Your Equipment Registry logs every major system in your home, and your seasonal Maintenance Calendar keeps everything running smoothly year-round.",
    icon: Wrench,
    button: "Next →",
  },
  {
    title: "You're All Set",
    body: "Your portal is ready. Explore at your own pace — or jump straight to your report to see your Home Health Score and what your advisor recommends.",
    icon: Star,
    button: null,
  },
];

const ClientOnboardingModal = ({ onComplete }: ClientOnboardingModalProps) => {
  const [step, setStep] = useState(0);
  const { markOnboardingComplete, ensureRecord } = useTutorialProgress();

  const handleFinish = async (navigateTo?: string) => {
    await ensureRecord();
    await markOnboardingComplete();
    onComplete(navigateTo);
  };

  const handleSkip = () => handleFinish();

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/60 backdrop-blur-sm">
      <div className="bg-background rounded-lg shadow-2xl max-w-lg w-full mx-4 p-8 relative animate-scale-in">
        {/* Skip */}
        {step < 3 && (
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-xs font-sans text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
          >
            Skip tour
          </button>
        )}

        {/* Icon */}
        {current.icon && (
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-5">
            <current.icon className="w-6 h-6 text-accent" />
          </div>
        )}

        {/* Content */}
        <h2 className="font-display text-xl text-foreground mb-1">{current.title}</h2>
        {current.subtitle && (
          <p className="text-sm font-sans text-muted-foreground mb-4">{current.subtitle}</p>
        )}
        <p className="text-sm font-sans text-muted-foreground leading-relaxed mb-6">{current.body}</p>

        {/* Buttons */}
        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)} className="w-full font-sans">
            {current.button}
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button onClick={() => handleFinish("report")} className="flex-1 font-sans">
              View My Report
            </Button>
            <Button onClick={() => handleFinish()} variant="outline" className="flex-1 font-sans">
              Explore My Portal
            </Button>
          </div>
        )}

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${i <= step ? "bg-accent" : "bg-muted-foreground/30"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientOnboardingModal;
