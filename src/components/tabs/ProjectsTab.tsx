import { Card } from "@/components/ui/card";

interface ProjectsTabProps {
  onNavigate: (tab: string) => void;
}

const ProjectsTab = ({ onNavigate }: ProjectsTabProps) => {
  return (
    <div>
      <div className="py-16 md:py-24 px-6 md:px-20 max-w-[1400px] mx-auto">
        <h1 className="font-display text-3xl text-foreground mb-6">Project Management</h1>
        <p className="text-base text-muted-foreground max-w-[60ch]">
          Track active and planned home improvement projects. This section will populate
          once you begin work recommended in your Home Clarity Report.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 max-w-[1400px] mx-auto px-6 md:px-20 pb-16">
        <Card className="md:col-span-2 p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-6">No Active Projects</h2>
          <p className="text-base text-foreground mb-6">
            Your project dashboard awaits its first milestone. Once you approve work from your
            Home Clarity Report, this space will display project timelines, contractor
            assignments, and progress tracking.
          </p>
          <button
            onClick={() => onNavigate("report")}
            className="font-mono text-[11px] text-foreground bg-transparent border-none underline cursor-pointer"
          >
            Review Report Recommendations
          </button>
        </Card>

        <Card className="p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-6">Upcoming Considerations</h2>
          <p className="text-base text-foreground mb-6">
            Based on your report timeline, these projects are approaching their optimal start windows:
          </p>
          <div className="flex flex-col gap-4">
            <div className="py-3 border-b border-border font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground hover:pl-3 transition-all cursor-pointer">
              Furnace Replacement (Immediate)
            </div>
            <div className="py-3 border-b border-border font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground hover:pl-3 transition-all cursor-pointer">
              Electrical Panel Upgrade (Year 1)
            </div>
            <div className="py-3 border-b border-border font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground hover:pl-3 transition-all cursor-pointer">
              Roof Assessment (Year 2-3)
            </div>
            <div className="py-3 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground hover:pl-3 transition-all cursor-pointer">
              Kitchen Refresh (Year 3-5)
            </div>
          </div>
        </Card>

        <Card className="p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-6">Project Archive</h2>
          <p className="text-base text-foreground mb-6">
            Completed projects will be documented here for warranty tracking and future reference.
          </p>
          <p className="text-sm text-muted-foreground">No completed projects yet.</p>
        </Card>
      </div>
    </div>
  );
};

export default ProjectsTab;
