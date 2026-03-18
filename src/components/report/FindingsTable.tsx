import { Badge } from "@/components/ui/badge";

export interface Finding {
  observation: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  action: string;
  cost: string;
}

interface FindingsTableProps {
  findings: Finding[];
}

const severityBg: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

const FindingsTable = ({ findings }: FindingsTableProps) => {
  if (!findings || findings.length === 0) return null;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h4 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Findings & Observations
        </h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-2.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Observation
              </th>
              <th className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground w-24">
                Severity
              </th>
              <th className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Recommended Action
              </th>
              <th className="text-right px-5 py-2.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground w-28">
                Est. Cost
              </th>
            </tr>
          </thead>
          <tbody>
            {findings.map((f, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="px-5 py-3 font-sans text-foreground">{f.observation}</td>
                <td className="px-4 py-3">
                  <span className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-full ${severityBg[f.severity] || ""}`}>
                    {f.severity}
                  </span>
                </td>
                <td className="px-4 py-3 font-sans text-muted-foreground">{f.action}</td>
                <td className="px-5 py-3 text-right font-mono text-[12px] text-foreground font-medium">
                  {f.cost}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FindingsTable;
