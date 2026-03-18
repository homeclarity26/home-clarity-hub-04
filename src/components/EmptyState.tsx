import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-muted-foreground" />
    </div>
    <h3 className="font-sans text-base font-medium text-foreground mb-1">{title}</h3>
    <p className="font-sans text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
    {actionLabel && onAction && (
      <Button variant="outline" size="sm" onClick={onAction} className="font-sans">
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
