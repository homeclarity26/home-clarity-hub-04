import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ConciergeRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
}

const REQUEST_TYPES = [
  { value: "vendor_referral", label: "Vendor Referral" },
  { value: "maintenance", label: "Maintenance Request" },
  { value: "question", label: "General Question" },
  { value: "emergency", label: "Emergency / Urgent" },
  { value: "project", label: "Project Inquiry" },
  { value: "other", label: "Other" },
];

const ConciergeRequestModal = ({ open, onOpenChange, propertyId }: ConciergeRequestModalProps) => {
  const { user } = useAuth();
  const [type, setType] = useState("question");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !user) return;
    setSubmitting(true);
    try {
      const { error } = await (supabase.from("service_requests" as any) as any).insert({
        property_id: propertyId,
        client_id: user.id,
        request_type: type,
        title: title.trim(),
        description: description.trim() || null,
        status: "pending",
        priority: type === "emergency" ? "urgent" : "normal",
      });
      if (error) throw error;
      toast.success("Request submitted! Your advisor will respond shortly.");
      setTitle("");
      setDescription("");
      setType("question");
      onOpenChange(false);
    } catch (err) {
      console.error("Service request error:", err);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Concierge Request
          </DialogTitle>
          <DialogDescription className="font-sans text-sm">
            Your advisor will personally handle this request and follow up with you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-sans font-medium text-foreground mb-1.5 block">Request Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="font-sans text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REQUEST_TYPES.map((rt) => (
                  <SelectItem key={rt.value} value={rt.value} className="font-sans text-sm">{rt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-sans font-medium text-foreground mb-1.5 block">Subject</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Need a plumber recommendation"
              className="font-sans text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-sans font-medium text-foreground mb-1.5 block">Details (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any details that would help your advisor..."
              rows={3}
              className="font-sans text-sm resize-none"
            />
          </div>

          <Button onClick={handleSubmit} disabled={!title.trim() || submitting} className="w-full gap-2 font-sans">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConciergeRequestModal;
