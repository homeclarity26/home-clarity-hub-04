import { reportPages } from "@/data/reportContent";
import ReportPage from "@/components/report/ReportPage";

interface ReportTabProps {
  activePageId: string | null;
}

const ReportTab = ({ activePageId }: ReportTabProps) => {
  const page = activePageId ? reportPages[activePageId] : null;

  if (page) {
    return <ReportPage page={page} />;
  }

  return (
    <div>
      <div className="bg-primary text-primary-foreground py-16 md:py-24 px-6 md:px-20 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-6">
          The Johnson Residence
        </p>
        <h1 className="font-display text-3xl md:text-[48px] text-primary-foreground">
          Home Clarity Report
        </h1>
      </div>
      <div className="max-w-[800px] mx-auto px-6 md:px-20 py-16 md:py-24">
        <h2 className="font-display text-3xl text-foreground mb-10">
          Select a section from the Report menu above
        </h2>
        <p className="text-base text-foreground max-w-[65ch]">
          Navigate through your comprehensive home assessment using the cascade menu in the
          header. Each section contains detailed analysis, budget estimates, and strategic
          recommendations.
        </p>
      </div>
    </div>
  );
};

export default ReportTab;
