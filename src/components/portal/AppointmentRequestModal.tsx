import { useState } from "react";
import { Calendar, Clock, X, CheckCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AppointmentRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  clientName?: string;
}

const topics = [
  "Report Questions",
  "Project Discussion",
  "New Assessment",
  "General Check-In",
  "Other",
];

const AppointmentRequestModal = ({ open, onOpenChange, propertyId, clientName }: AppointmentRequestModalProps) => {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<{ date: string; time: string }[]>([
    { date: "", time: "" },
    { date: "", time: "" },
    { date: "", time: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateSlot = (index: number, field: "date" | "time", value: string) => {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const validSlots = slots.filter(s => s.date && s.time);

  const handleSubmit = async () => {
    if (!user || !topic || validSlots.length === 0) {
      toast.error("Please select a topic and at least one preferred time");
      return;
    }

    setSubmitting(true);
    try {
      // Create appointment request
      const { error } = await (supabase.from("appointment_requests" as any) as any).insert({
        client_id: user.id,
        property_id: propertyId,
        topic,
        notes: notes || null,
        preferred_slots_json: validSlots.map(s => `${s.date}T${s.time}:00`),
      });

      if (error) throw error;

      // Send confirmation message
      await supabase.from("property_messages").insert({
        property_id: propertyId,
        sender_id: user.id,
        message: `I'd like to schedule a consultation about: ${topic}. ${notes ? `Notes: ${notes}` : ""}`,
      });

      setSubmitted(true);
      toast.success("Consultation request submitted!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    if (submitted) {
      setSubmitted(false);
      setTopic("");
      setNotes("");
      setSlots([{ date: "", time: "" }, { date: "", time: "" }, { date: "", time: "" }]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">
            {submitted ? "Request Submitted!" : "Schedule a Consultation"}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <p className="font-sans text-sm text-muted-foreground mb-2">
              Thanks{clientName ? `, ${clientName}` : ""}! Your advisor has received your consultation request for <strong>{topic}</strong> and will confirm a time shortly.
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground mt-4">
              Check your Messages tab for updates
            </p>
            <Button onClick={handleClose} className="mt-6">Close</Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Topic */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Topic</label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preferred Time Slots */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3 block">
                Preferred Times (select up to 3)
              </label>
              <div className="space-y-3">
                {slots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                    <div className="flex-1 flex gap-2">
                      <div className="flex-1 relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <input
                          type="date"
                          value={slot.date}
                          onChange={e => updateSlot(i, "date", e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full pl-9 pr-3 py-2 border border-input rounded-md text-sm font-sans bg-background text-foreground"
                        />
                      </div>
                      <div className="w-32 relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <input
                          type="time"
                          value={slot.time}
                          onChange={e => updateSlot(i, "time", e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-input rounded-md text-sm font-sans bg-background text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2 block">Notes (optional)</label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Anything you'd like to discuss..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !topic || validSlots.length === 0}
              className="w-full"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Request
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentRequestModal;
