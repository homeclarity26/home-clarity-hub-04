import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet, Loader2, CheckCircle, Users, DollarSign, Briefcase, Clock, Heart, Wrench, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EXPORT_TYPES = [
  { value: "client_list", label: "Client List", icon: Users, description: "All clients with contact info and property details" },
  { value: "revenue_summary", label: "Revenue Summary", icon: DollarSign, description: "Invoiced, paid, outstanding & overdue by month" },
  { value: "project_status", label: "Project Status Report", icon: Briefcase, description: "All projects with status, budget vs actual" },
  { value: "invoice_aging", label: "Invoice Aging Report", icon: Clock, description: "Unpaid invoices grouped by overdue days" },
  { value: "trade_partner_performance", label: "Trade Partner Performance", icon: Shield, description: "Vendors with ratings, specialties & status" },
  { value: "maintenance_due", label: "Maintenance Due Report", icon: Wrench, description: "Upcoming maintenance across all properties" },
] as const;

interface ExportMenuProps {
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default";
}

const ExportMenu = ({ variant = "outline", size = "sm" }: ExportMenuProps) => {
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState<string>("client_list");
  const [maintenanceDays, setMaintenanceDays] = useState("30");
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setDownloadUrl(null);
    try {
      // Create job record
      const { data: user } = await supabase.auth.getUser();
      const { data: job } = await supabase.from("export_jobs")
        .insert({
          export_type: exportType,
          filter_params: exportType === "maintenance_due" ? { days: Number(maintenanceDays) } : {},
          status: "pending",
          created_by: user.user?.id,
        })
        .select()
        .single();

      const { data, error } = await supabase.functions.invoke("generate-export", {
        body: {
          export_type: exportType,
          filter_params: exportType === "maintenance_due" ? { days: Number(maintenanceDays) } : {},
          job_id: job?.id,
        },
      });

      if (error) throw error;
      if (data?.file_url) {
        setDownloadUrl(data.file_url);
        toast.success(`Export ready — ${data.rows_count} rows`);
      }
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Export failed");
    } finally {
      setLoading(false);
    }
  };

  const selected = EXPORT_TYPES.find((t) => t.value === exportType);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setDownloadUrl(null); }}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-1.5 text-xs font-sans">
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans">Export Data</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-sans font-medium text-foreground">Report Type</label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger className="font-sans">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="font-sans">
                    <div className="flex items-center gap-2">
                      <t.icon className="w-3.5 h-3.5 text-muted-foreground" />
                      {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <p className="text-[11px] font-sans text-muted-foreground">{selected.description}</p>
            )}
          </div>

          {exportType === "maintenance_due" && (
            <div className="space-y-2">
              <label className="text-xs font-sans font-medium text-foreground">Lookahead Period</label>
              <Select value={maintenanceDays} onValueChange={setMaintenanceDays}>
                <SelectTrigger className="font-sans w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Next 30 days</SelectItem>
                  <SelectItem value="60">Next 60 days</SelectItem>
                  <SelectItem value="90">Next 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={handleExport}
              disabled={loading}
              className="gap-1.5 font-sans flex-1"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5" />
              )}
              {loading ? "Generating..." : "Generate CSV"}
            </Button>

            {downloadUrl && (
              <Button asChild variant="outline" className="gap-1.5 font-sans">
                <a href={downloadUrl} download>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Download
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportMenu;
