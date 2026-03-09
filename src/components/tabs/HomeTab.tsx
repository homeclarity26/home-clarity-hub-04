import { FileText, Hammer, Receipt, Calendar, Users, MessageCircle, Phone, ChevronRight } from "lucide-react";

interface HomeTabProps {
  onNavigate: (tab: string, pageId?: string) => void;
  onTabChange?: (tab: string) => void;
  propertyName?: string;
  propertyAddress?: string;
  completionPercent?: number;
  creatorName?: string;
}

const HomeTab = ({
  onNavigate,
  onTabChange,
  propertyName = "Your Home",
  propertyAddress,
  completionPercent = 0,
  creatorName = "Your HBC Team",
}: HomeTabProps) => {
  const handleAskQuestion = () => {
    const input = document.querySelector<HTMLInputElement>('footer input[type="text"]');
    if (input) {
      input.focus();
      input.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  };

  const statusLabel = completionPercent === 100 ? "COMPLETE" : completionPercent > 0 ? "IN PROGRESS" : "NOT STARTED";

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-12 md:py-16 px-6 md:px-20 max-w-4xl mx-auto">
        <h1 className="font-display text-3xl md:text-[36px] text-foreground mb-3">
          {propertyName}
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-2">
          Home Operating System
        </p>
        {propertyAddress && (
          <p className="font-sans text-base text-muted-foreground">{propertyAddress}</p>
        )}
      </section>

      {/* Card Grid */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-20 pb-16 flex flex-col gap-10">

        {/* Row 1: Portal Status */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Your Portal Status</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Home Clarity Report */}
            <button
              onClick={() => onNavigate("report")}
              className="group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border border-l-[3px] border-l-accent text-left w-full"
            >
              <FileText className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <h2 className="font-display text-xl text-foreground mb-1">Home Clarity Report</h2>
                <p className="font-sans text-sm text-muted-foreground">Your complete home assessment</p>
              </div>
              <div className="mt-2">
                <div className="w-full h-0.5 bg-border relative mb-2">
                  <div className="h-full bg-accent transition-all" style={{ width: `${completionPercent}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {completionPercent}% Complete
                  </p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">{statusLabel}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end -mt-1 transition-colors" />
            </button>

            {/* Active Projects */}
            <button
              onClick={() => onNavigate("projects")}
              className="group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full"
            >
              <Hammer className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <h2 className="font-display text-xl text-foreground mb-1">Active Projects</h2>
                <p className="font-sans text-sm text-muted-foreground">Track ongoing home improvements</p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mt-1">No active projects</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>
          </div>
        </div>

        {/* Row 2: Portal Navigation */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Navigate Your Portal</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            <button
              onClick={() => onNavigate("payments")}
              className="group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full min-h-[180px]"
            >
              <Receipt className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <h2 className="font-display text-xl text-foreground mb-1">Payments</h2>
                <p className="font-sans text-sm text-muted-foreground line-clamp-2">Account & transaction history</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>

            <button
              onClick={() => onNavigate("schedule")}
              className="group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full min-h-[180px]"
            >
              <Calendar className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <h2 className="font-display text-xl text-foreground mb-1">Schedule & Timeline</h2>
                <p className="font-sans text-sm text-muted-foreground line-clamp-2">Appointments & reminders</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>

            <button
              onClick={() => onNavigate("contacts")}
              className="group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full min-h-[180px]"
            >
              <Users className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <h2 className="font-display text-xl text-foreground mb-1">Your Home Team</h2>
                <p className="font-sans text-sm text-muted-foreground line-clamp-2">Advisors & vendor partners</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>
          </div>
        </div>

        {/* Row 3: Quick Actions */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            <button
              onClick={() => onNavigate("report")}
              className="group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full"
            >
              <FileText className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <h2 className="font-display text-xl text-foreground mb-1">View Your Report</h2>
                <p className="font-sans text-sm text-muted-foreground line-clamp-2">Read your complete Home Clarity assessment</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>

            <button
              onClick={handleAskQuestion}
              className="group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full"
            >
              <MessageCircle className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <h2 className="font-display text-xl text-foreground mb-1">Ask a Question</h2>
                <p className="font-sans text-sm text-muted-foreground line-clamp-2">AI-powered answers about your home</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>

            <button
              onClick={() => onNavigate("contacts")}
              className="group bg-card rounded-lg p-8 shadow-hbc-sm hover:shadow-hbc-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3 border border-border text-left w-full"
            >
              <Phone className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <h2 className="font-display text-xl text-foreground mb-1">Contact Your Advisor</h2>
                <p className="font-sans text-sm text-muted-foreground line-clamp-2">Adam Kinney — Founder & Lead Advisor</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent self-end transition-colors" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomeTab;
