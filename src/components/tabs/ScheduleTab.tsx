import { Card } from "@/components/ui/card";

const ScheduleTab = () => {
  return (
    <div>
      <div className="py-16 md:py-24 px-6 md:px-20 max-w-[1400px] mx-auto">
        <h1 className="font-display text-3xl text-foreground mb-6">Schedule & Timeline</h1>
        <p className="text-base text-muted-foreground max-w-[60ch]">
          Upcoming appointments, maintenance reminders, and project milestones.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 max-w-[1400px] mx-auto px-6 md:px-20 pb-16">
        <Card className="p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-8">This Week</h2>
          <div className="relative pl-6">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />

            <div className="relative pb-10">
              <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full bg-accent" />
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                March 15, 2026
              </p>
              <p className="text-base text-foreground">
                Initial Home Assessment — Roof and Exterior
              </p>
            </div>

            <div className="relative pb-10">
              <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full bg-foreground" />
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                March 17, 2026
              </p>
              <p className="text-base text-foreground">
                HVAC System Inspection
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full bg-foreground" />
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                March 19, 2026
              </p>
              <p className="text-base text-foreground">
                Report Review Call with Adam Kinney
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-8">Upcoming Milestones</h2>
          <div className="relative pl-6">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />

            <div className="relative pb-10">
              <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full bg-accent" />
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                April 2026
              </p>
              <p className="text-base text-foreground">
                Home Clarity Report Delivery
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full bg-foreground" />
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
                May 2026
              </p>
              <p className="text-base text-foreground">
                Strategic Planning Session
              </p>
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2 p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl text-foreground mb-6">Annual Reminders</h2>
          <p className="text-base text-foreground">
            Seasonal maintenance schedules will be populated after your report is complete.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ScheduleTab;
