import { useState } from "react";
import { FileText, Wrench, Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTutorialProgress } from "@/hooks/useTutorialProgress";

interface ClientOnboardingModalProps {
  onComplete: (navigateTo?: string) => void;
  propertyName?: string;
  creatorName?: string;
}

type Step = {
  id: string;
  title: string;
  subtitle?: string;
  body: string;
  icon: React.ComponentType<{ className?: string }> | null;
  button: string;
};

const steps: Step[] = [
  {
    id: "welcome",
    title: "Welcome to Your Home Clarity Hub",
    subtitle: "Your personalized home stewardship portal.",
    body: "Everything you need to understand, maintain, and improve your home lives here. Your advisor has built this portal specifically for you and your property.",
    icon: null,
    button: "Get Started →",
  },
  {
    id: "report",
    title: "Your Home Clarity Report",
    body: "At the heart of your portal is your Home Clarity Report; a chapter-by-chapter assessment of your home's condition. It includes condition ratings for every major system, Priority Action Items, and a Strategy chapter built just for your home.",
    icon: FileText,
    button: "Next →",
  },
  {
    id: "tools",
    title: "Projects, Schedule & Equipment",
    body: "Your advisor creates projects directly tied to your report findings. Track their status, see estimated costs, and follow along as work is completed. Your Equipment Registry logs every major system in your home, and your seasonal Maintenance Calendar keeps everything running smoothly year-round.",
    icon: Wrench,
    button: "Next →",
  },
  {
    id: "ready",
    title: "You're All Set",
    body: "Your portal is ready. Explore at your own pace, or jump straight to your report to see what your advisor recommends.",
    icon: Star,
    button: null,
  },
];

const ClientOnboardingModal = ({ onComplete, propertyName, creatorName }: ClientOnboardingModalProps) => {
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
        {current.id === "welcome" && propertyName && (
          <p className="font-display text-base text-accent mb-1">{propertyName}</p>
        )}
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
          <div className="flex flex-col gap-2">
            <div className="flex gap-3">
              <Button onClick={() => handleFinish("report")} className="flex-1 font-sans">
                View My Report
              </Button>
              <Button onClick={() => handleFinish("messages")} variant="outline" className="flex-1 font-sans gap-1.5">
                <MessageCircle className="w-4 h-4" />
                Message {creatorName?.split(" ")[0] || "Advisor"}
              </Button>
            </div>
            <Button onClick={() => handleFinish()} variant="ghost" size="sm" className="font-sans text-muted-foreground">
              Explore My Portal
            </Button>
          </div>
        )}

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? "bg-accent w-6" : i < step ? "bg-accent/40 w-1.5" : "bg-muted-foreground/20 w-1.5"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientOnboardingModal;
