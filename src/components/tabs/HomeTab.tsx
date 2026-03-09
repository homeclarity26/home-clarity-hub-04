import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface HomeTabProps {
  onNavigate: (tab: string, pageId?: string) => void;
  propertyName?: string;
  completionPercent?: number;
  creatorName?: string;
}

const HomeTab = ({ onNavigate, propertyName = "Your Home", completionPercent = 0, creatorName = "Your HBC Team" }: HomeTabProps) => {
  return (
    <div>
      <section className="text-center py-16 md:py-24 px-6 md:px-20 max-w-4xl mx-auto">
        <h1 className="font-display text-3xl md:text-[32px] text-foreground mb-6">
          {propertyName}
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Home Operating System
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 max-w-[1400px] mx-auto px-6 md:px-20 pb-16">
        <Card className="md:col-span-2 p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-2xl md:text-[24px] text-foreground mb-6">
            Welcome to Your Home Clarity Portal
          </h2>
          <p className="text-base text-foreground max-w-prose mb-6">
            This is your family's command center for the next 50 years of home stewardship.
            Here you will find your complete Home Clarity Report, track ongoing projects,
            manage payments, and coordinate with your dedicated team of professionals.
          </p>
          <p className="text-base text-foreground max-w-prose mb-6">
            Every element of this portal has been designed to provide radical transparency
            and Disney-level service. Your home is not just a building—it is a legacy asset
            requiring strategic stewardship.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => onNavigate("report")}
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-foreground bg-transparent border-none cursor-pointer hover:text-accent transition-colors"
            >
              View Your Home Clarity Report <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate("schedule")}
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-foreground bg-transparent border-none cursor-pointer hover:text-accent transition-colors"
            >
              Schedule a Consultation <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Card>

        <Card className="p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-xl md:text-[24px] text-foreground mb-6">
            How to Use This Portal
          </h2>
          <p className="text-base text-foreground mb-6">
            Navigate through your home's documentation using the tabs above. The Report
            contains your comprehensive assessment. Projects tracks active work. Payments
            manages your financial history.
          </p>
          <div className="flex flex-col gap-4">
            <button className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-foreground bg-transparent border-none cursor-pointer hover:text-accent transition-colors text-left">
              Watch Tutorial Video <ArrowRight className="w-4 h-4" />
            </button>
            <button className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-foreground bg-transparent border-none cursor-pointer hover:text-accent transition-colors text-left">
              Download User Guide <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Card>

        <Card className="p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-xl md:text-[24px] text-foreground mb-6">
            Report Completion
          </h2>
          <p className="text-base text-foreground mb-6">
            Your Home Clarity Report is currently being assembled by {creatorName}.
          </p>
          <div className="w-full h-0.5 bg-border relative mt-6">
            <div className="h-full bg-accent" style={{ width: `${completionPercent}%` }} />
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground mt-3">
            {completionPercent}% Complete
          </p>
        </Card>

        <Card className="md:col-span-2 p-8 md:p-10 shadow-hbc-sm hover:shadow-hbc-md transition-all hover:-translate-y-0.5">
          <h2 className="font-display text-xl md:text-[24px] text-foreground mb-6">
            Active Projects
          </h2>
          <p className="text-base text-foreground mb-6">
            You currently have no active projects. Once you begin work based on your Home
            Clarity Report recommendations, this space will display project timelines,
            contractor information, and progress updates.
          </p>
          <button
            onClick={() => onNavigate("schedule")}
            className="font-mono text-[11px] text-foreground bg-transparent border-none underline cursor-pointer mt-2"
          >
            Schedule Consultation
          </button>
        </Card>
      </div>
    </div>
  );
};

export default HomeTab;
