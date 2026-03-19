import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Settings } from "lucide-react";
import { toast } from "sonner";

const ReferralSettings = () => {
  const [enabled, setEnabled] = useState(() => localStorage.getItem("hbc_referral_enabled") === "true");
  const [creditAmount, setCreditAmount] = useState(() => localStorage.getItem("hbc_referral_credit") || "50");
  const [expiryDays, setExpiryDays] = useState(() => localStorage.getItem("hbc_referral_expiry") || "365");
  const [conversionCriteria, setConversionCriteria] = useState(() => localStorage.getItem("hbc_referral_criteria") || "first_report");
  const [emailSubject, setEmailSubject] = useState(() => localStorage.getItem("hbc_referral_email_subject") || "Great news — you've earned a referral credit!");
  const [emailBody, setEmailBody] = useState(() => localStorage.getItem("hbc_referral_email_body") || "Hi {{referrer_name}},\n\n{{referred_name}} just joined Hometown Builders Club through your referral!\n\nYou've earned a ${{credit_amount}} credit that will be applied to your next invoice.\n\nThank you for spreading the word!\n\n— The HBC Team");

  const handleSave = () => {
    localStorage.setItem("hbc_referral_enabled", enabled.toString());
    localStorage.setItem("hbc_referral_credit", creditAmount);
    localStorage.setItem("hbc_referral_expiry", expiryDays);
    localStorage.setItem("hbc_referral_criteria", conversionCriteria);
    localStorage.setItem("hbc_referral_email_subject", emailSubject);
    localStorage.setItem("hbc_referral_email_body", emailBody);
    toast.success("Referral settings saved");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-accent" />
          <h3 className="text-base font-sans font-semibold text-foreground">Referral Program</h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-sans">Enable Referral Program</Label>
            <p className="text-xs text-muted-foreground">Allow clients to earn credits for referring friends</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Credit per Referral ($)</Label>
            <Input
              type="number"
              value={creditAmount}
              onChange={e => setCreditAmount(e.target.value)}
              className="font-sans"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Credit Expiry (days, 0 = never)</Label>
            <Input
              type="number"
              value={expiryDays}
              onChange={e => setExpiryDays(e.target.value)}
              className="font-sans"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-sans">Conversion Criteria</Label>
          <Select value={conversionCriteria} onValueChange={setConversionCriteria}>
            <SelectTrigger className="font-sans"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="account_created">Client account created</SelectItem>
              <SelectItem value="first_report">First report published</SelectItem>
              <SelectItem value="first_invoice_paid">First invoice paid</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">
            {conversionCriteria === "account_created" && "Credit issued when referred person creates an account."}
            {conversionCriteria === "first_report" && "Credit issued when referred person's first report is published."}
            {conversionCriteria === "first_invoice_paid" && "Credit issued when referred person pays their first invoice."}
          </p>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-base font-sans font-semibold text-foreground">Referral Notification Email</h3>
        </div>
        <p className="text-xs text-muted-foreground">Customize the email sent to referrers when a referral converts. Use merge tags: {"{{referrer_name}}"}, {"{{referred_name}}"}, {"{{credit_amount}}"}</p>

        <div className="space-y-1.5">
          <Label className="text-xs font-sans">Subject</Label>
          <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="font-sans" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-sans">Body</Label>
          <Textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} className="font-sans text-sm min-h-[150px]" />
        </div>
      </Card>

      <Button onClick={handleSave} className="font-sans">Save Referral Settings</Button>
    </div>
  );
};

export default ReferralSettings;
