import { Card } from "@/components/ui/card";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  projectId: string;
}

const ProjectScheduleTab = ({ projectId }: Props) => {
  return (
    <div className="space-y-4 mt-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-sans font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />Project Schedule
          </h3>
          <Button size="sm" variant="outline" className="gap-1 text-xs font-sans">
            <Plus className="w-3.5 h-3.5" />Add Event
          </Button>
        </div>
        <p className="text-sm text-muted-foreground font-sans">
          Project schedule shows phase start/end dates, task due dates, trade partner work days, inspections, and payment due dates.
          Events sync to the admin calendar automatically.
        </p>
        <div className="mt-4 p-8 border border-dashed border-border rounded-lg text-center">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-sans">Calendar events from phases and tasks will appear here.</p>
        </div>
      </Card>
    </div>
  );
};

export default ProjectScheduleTab;
