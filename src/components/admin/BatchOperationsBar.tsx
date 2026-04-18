import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, CheckSquare, Mail, Send, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface BatchClient {
  id: string;
  name: string;
  email: string;
}

interface BatchOperationsBarProps {
  selectedIds: string[];
  onClear: () => void;
  context: "clients" | "report-pages";
  reportId?: string;
  clients?: BatchClient[];
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "needs_review", label: "Needs Review" },
  { value: "complete", label: "Complete" },
  { value: "published", label: "Published" },
  { value: "inactive", label: "Inactive" },
];

const EMAIL_TEMPLATES = [
  { value: "custom", label: "Custom Message", subject: "", body: "" },
  { value: "check_in", label: "Check-In", subject: "Quick Check-In from Your HBC Advisor", body: "Hi {{name}},\n\nJust wanted to check in and see how things are going with your home. If you have any questions about your report or upcoming projects, don't hesitate to reach out through your portal.\n\nBest regards,\nYour HBC Advisor" },
  { value: "report_reminder", label: "Report Reminder", subject: "Your Home Clarity Report Awaits", body: "Hi {{name}},\n\nJust a friendly reminder that your Home Clarity Report is available in your portal. Take a few minutes to review the findings and recommendations — it's a great roadmap for keeping your home in top shape.\n\nBest regards,\nYour HBC Advisor" },
  { value: "maintenance_season", label: "Seasonal Maintenance", subject: "Seasonal Maintenance Reminders", body: "Hi {{name}},\n\nAs the season changes, now is a great time to review your home's maintenance schedule. Log in to your portal to see upcoming tasks and service dates for your equipment.\n\nBest regards,\nYour HBC Advisor" },
];

const BatchOperationsBar = ({ selectedIds, onClear, context, reportId, clients }: BatchOperationsBarProps) => {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailTemplate, setEmailTemplate] = useState("custom");
  const [isSending, setIsSending] = useState(false);

  if (selectedIds.length === 0) return null;

  const selectedClients = (clients || []).filter((c) => selectedIds.includes(c.id));
  const recipientsWithEmail = selectedClients.filter((c) => c.email);
  const recipientsWithoutEmail = selectedClients.filter((c) => !c.email);

  const handleBulkStatusChange = async (newStatus: string) => {
    if (context !== "report-pages") return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("report_pages")
        .update({ status: newStatus })
        .in("id", selectedIds);
      if (error) throw error;

      if (reportId) {
        const { data: pages } = await supabase
          .from("report_pages")
          .select("status")
          .eq("report_id", reportId);
        if (pages && pages.length > 0) {
          const done = pages.filter((p) => p.status === "complete" || p.status === "published").length;
          const pct = Math.round((done / pages.length) * 100);
          await supabase.from("reports").update({ completion_percent: pct }).eq("id", reportId);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["admin-report-pages", reportId] });
      await queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      toast.success(`Updated ${selectedIds.length} pages to ${newStatus}`);
      onClear();
    } catch {
      toast.error("Bulk status update failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenEmailCompose = () => {
    setEmailSubject("");
    setEmailBody("");
    setEmailTemplate("custom");
    setEmailOpen(true);
  };

  const handleTemplateChange = (val: string) => {
    setEmailTemplate(val);
    const tpl = EMAIL_TEMPLATES.find((t) => t.value === val);
    if (tpl && tpl.value !== "custom") {
      setEmailSubject(tpl.subject);
      setEmailBody(tpl.body);
    }
  };

  const handleSendBatchEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error("Subject and message body are required");
      return;
    }
    if (recipientsWithEmail.length === 0) {
      toast.error("No selected clients have email addresses");
      return;
    }

    setIsSending(true);
    try {
      let successCount = 0;
      const { data: { user } } = await supabase.auth.getUser();

      for (const client of recipientsWithEmail) {
        const personalizedBody = emailBody.replace(/\{\{name\}\}/g, client.name || "Homeowner");

        const { error } = await supabase
          .from("property_messages")
          .insert({
            property_id: client.id,
            sender_id: user?.id || "",
            message: `📧 **${emailSubject}**\n\n${personalizedBody}`,
            message_type: "email_notification",
          });

        if (!error) {
          successCount++;
          await supabase.from("client_timeline_events").insert({
            client_id: client.id,
            event_type: "email_sent",
            event_description: `Batch email sent: "${emailSubject}"`,
            actor: "admin",
            metadata_json: { subject: emailSubject, template: emailTemplate },
          });
        }
      }

      toast.success(`Email sent to ${successCount} client${successCount !== 1 ? "s" : ""}`, {
        description: recipientsWithoutEmail.length > 0
          ? `${recipientsWithoutEmail.length} client(s) skipped — no email on file`
          : undefined,
      });
      setEmailOpen(false);
      onClear();
    } catch {
      toast.error("Failed to send batch emails");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-20 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg flex items-center gap-3 flex-wrap shadow-lg animate-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4" />
          <span className="text-sm font-sans font-medium">
            {selectedIds.length} selected
          </span>
        </div>

        <div className="h-4 w-px bg-primary-foreground/30" />

        {context === "report-pages" && (
          <Select value="" onValueChange={(val) => handleBulkStatusChange(val)} disabled={isProcessing}>
            <SelectTrigger className="h-7 w-auto min-w-[140px] text-xs font-sans bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
              <SelectValue placeholder="Set status…" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs font-sans">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {context === "clients" && (
          <Button
            variant="secondary"
            size="sm"
            className="h-7 text-xs font-sans gap-1.5"
            onClick={handleOpenEmailCompose}
            disabled={isProcessing}
          >
            <Mail className="w-3 h-3" />
            Send Email
          </Button>
        )}

        {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}

        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs font-sans text-primary-foreground hover:bg-primary-foreground/10"
            onClick={onClear}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Send Batch Email
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-sans font-medium">
                  {recipientsWithEmail.length} recipient{recipientsWithEmail.length !== 1 ? "s" : ""}
                </span>
                {recipientsWithoutEmail.length > 0 && (
                  <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                    {recipientsWithoutEmail.length} missing email
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recipientsWithEmail.slice(0, 8).map((c) => (
                  <Badge key={c.id} variant="secondary" className="text-[11px] font-sans">
                    {c.name}
                  </Badge>
                ))}
                {recipientsWithEmail.length > 8 && (
                  <Badge variant="secondary" className="text-[11px] font-sans">
                    +{recipientsWithEmail.length - 8} more
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Template</Label>
              <Select value={emailTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger className="text-sm font-sans">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-sm font-sans">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject line…"
                className="font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-sans">Message</Label>
                <span className="text-[10px] text-muted-foreground font-sans">
                  Use {"{{name}}"} to personalize
                </span>
              </div>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Write your message…"
                className="font-sans min-h-[160px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)} className="font-sans">
              Cancel
            </Button>
            <Button
              onClick={handleSendBatchEmail}
              disabled={isSending || !emailSubject.trim() || !emailBody.trim() || recipientsWithEmail.length === 0}
              className="gap-1.5 font-sans"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send to {recipientsWithEmail.length} Client{recipientsWithEmail.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BatchOperationsBar;
