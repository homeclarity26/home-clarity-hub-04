import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  alert?: boolean;
}

const StatsCard = ({ label, value, icon: Icon, alert }: StatsCardProps) => (
  <Card className="p-5 flex items-center gap-4">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${alert ? "bg-accent/20" : "bg-muted"}`}>
      <Icon className={`w-5 h-5 ${alert ? "text-accent" : "text-muted-foreground"}`} />
    </div>
    <div>
      <p className="text-2xl font-sans font-bold text-foreground">{value}</p>
      <p className="text-xs font-sans text-muted-foreground">{label}</p>
    </div>
  </Card>
);

export default StatsCard;
