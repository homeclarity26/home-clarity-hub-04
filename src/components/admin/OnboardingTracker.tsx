import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, MapPin, StickyNote, Image, FileText, Send, UserCheck } from "lucide-react";
import type { AdminClient } from "@/hooks/useAdminData";

interface OnboardingTrackerProps {
  client: AdminClient;
}

const OnboardingTracker = ({ client }: OnboardingTrackerProps) => {
  const steps = [
    {
      label: "Property Details",
      done: !!(client.address && client.city && client.propertyType),
      icon: MapPin,
    },
    {
      label: "Discovery Notes",
      done: !!client.discoveryNotes,
      icon: StickyNote,
    },
    {
      label: "Digital Assets",
      done: client.digitalAssetsStatus === "complete",
      partial: client.digitalAssetsStatus === "partial",
      icon: Image,
    },
    {
      label: "Report Started",
      done: client.totalPages > 0,
      icon: FileText,
    },
    {
      label: "Report Published",
      done: client.reportStatus === "published",
      icon: Send,
    },
    {
      label: "Client Account",
      done: !!client.clientUserId,
      icon: UserCheck,
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const percent = Math.round((completedCount / steps.length) * 100);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-sans font-semibold text-foreground">Onboarding Progress</h3>
        <span className="text-xs font-sans text-muted-foreground">{completedCount}/{steps.length} complete</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="space-y-2">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center gap-3">
              {step.done ? (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <Circle className={`w-4 h-4 shrink-0 ${'partial' in step && step.partial ? 'text-accent' : 'text-muted-foreground/40'}`} />
              )}
              <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className={`text-sm font-sans ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default OnboardingTracker;
