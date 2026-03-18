import { useState, useCallback } from "react";
import { ChevronRight, ChevronLeft, FileText, Hammer, Receipt, Wrench, MessageCircle, Calendar, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingOverlayProps {
  propertyName: string;
  propertyAddress: string;
  creatorName: string;
  onComplete: () => void;
  onSendMessage: () => void;
}

const slides = [
  {
    id: "welcome",
    title: "Welcome to Your Home Clarity Hub",
    subtitle: "YOUR PERSONAL HOME STEWARDSHIP PORTAL",
  },
  {
    id: "tour",
    title: "Everything in One Place",
    subtitle: "YOUR PORTAL INCLUDES",
    features: [
      { icon: FileText, label: "Home Clarity Report", desc: "Your complete home assessment with condition ratings and recommendations" },
      { icon: Hammer, label: "Projects", desc: "Track ongoing and planned home improvements" },
      { icon: Receipt, label: "Payments", desc: "View invoices and transaction history" },
      { icon: Wrench, label: "Equipment", desc: "Your home's equipment registry with service tracking" },
      { icon: MessageCircle, label: "Messages", desc: "Direct line to your HBC advisor" },
      { icon: Calendar, label: "Schedule", desc: "Upcoming appointments and maintenance reminders" },
    ],
  },
  {
    id: "advisor",
    title: "Your Advisor Is Here for You",
    subtitle: "PERSONAL GUIDANCE",
  },
];

const OnboardingOverlay = ({
  propertyName,
  propertyAddress,
  creatorName,
  onComplete,
  onSendMessage,
}: OnboardingOverlayProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { user } = useAuth();

  const handleComplete = useCallback(async () => {
    if (user && user.id !== "00000000-0000-0000-0000-000000000000") {
      await (supabase.from("profiles") as any).update({ has_completed_onboarding: true }).eq("user_id", user.id);
    }
    onComplete();
  }, [user, onComplete]);

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[1000] bg-primary flex items-center justify-center">
      <button
        onClick={handleComplete}
        className="absolute top-6 right-6 p-2 text-primary-foreground/50 hover:text-primary-foreground transition-colors bg-transparent border-none cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="max-w-lg w-full px-8 text-center">
        {/* Slide content */}
        {slide.id === "welcome" && (
          <div className="space-y-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">{slide.subtitle}</p>
            <h1 className="font-display text-3xl md:text-4xl text-primary-foreground leading-tight">{slide.title}</h1>
            <div className="space-y-2 pt-4">
              <p className="font-display text-xl text-primary-foreground/90">{propertyName}</p>
              <p className="font-sans text-sm text-primary-foreground/50">{propertyAddress}</p>
            </div>
            <p className="font-sans text-sm text-primary-foreground/60 leading-relaxed pt-4">
              Your advisor has prepared a comprehensive portal for your home — including a detailed condition report,
              equipment registry, project tracking, and direct messaging.
            </p>
          </div>
        )}

        {slide.id === "tour" && (
          <div className="space-y-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">{slide.subtitle}</p>
            <h2 className="font-display text-2xl md:text-3xl text-primary-foreground">{slide.title}</h2>
            <div className="grid grid-cols-2 gap-3 pt-4">
              {slide.features!.map((f) => (
                <div key={f.label} className="bg-primary-foreground/5 rounded-lg p-4 text-left border border-primary-foreground/10">
                  <f.icon className="w-4 h-4 text-accent mb-2" />
                  <p className="font-sans text-sm font-medium text-primary-foreground mb-0.5">{f.label}</p>
                  <p className="font-sans text-[11px] text-primary-foreground/50 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {slide.id === "advisor" && (
          <div className="space-y-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">{slide.subtitle}</p>
            <h2 className="font-display text-2xl md:text-3xl text-primary-foreground">{slide.title}</h2>
            <div className="pt-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent mx-auto flex items-center justify-center">
                <span className="font-display text-xl text-accent">
                  {creatorName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              <p className="font-display text-xl text-primary-foreground mt-4">{creatorName}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground/40 mt-1">Your HBC Advisor</p>
            </div>
            <p className="font-sans text-sm text-primary-foreground/60 leading-relaxed pt-2">
              Have a question about your home? Need to schedule a consultation? Your advisor is just a message away.
            </p>
            <button
              onClick={() => { handleComplete(); onSendMessage(); }}
              className="mt-4 px-6 py-2.5 rounded-md bg-hbc-rust text-white font-sans text-sm font-medium hover:opacity-90 transition-opacity border-none cursor-pointer"
            >
              Send Your First Message
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12">
          <button
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            className={`p-2 rounded-md transition-colors bg-transparent border-none cursor-pointer ${
              currentSlide === 0 ? "opacity-0 pointer-events-none" : "text-primary-foreground/50 hover:text-primary-foreground"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-all border-none cursor-pointer ${
                  i === currentSlide ? "bg-accent w-6" : "bg-primary-foreground/20"
                }`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={handleComplete}
              className="px-5 py-2 rounded-md bg-accent text-accent-foreground font-mono text-[11px] uppercase tracking-[0.15em] hover:opacity-90 transition-opacity border-none cursor-pointer"
            >
              Get Started
            </button>
          ) : (
            <button
              onClick={() => setCurrentSlide(currentSlide + 1)}
              className="p-2 rounded-md text-primary-foreground/50 hover:text-primary-foreground transition-colors bg-transparent border-none cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Skip */}
        <button
          onClick={handleComplete}
          className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground/30 hover:text-primary-foreground/50 transition-colors bg-transparent border-none cursor-pointer"
        >
          Skip
        </button>
      </div>
    </div>
  );
};

export default OnboardingOverlay;
