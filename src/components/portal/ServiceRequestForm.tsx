import { useState, useCallback } from "react";
import { AlertTriangle, Camera, Loader2, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ServiceRequestFormProps {
  propertyId: string;
  onSubmitted?: () => void;
}

const CATEGORIES = [
  "HVAC", "Plumbing", "Electrical", "Roof", "Exterior", "Interior",
  "Appliances", "Foundation", "Safety", "Other",
];

const ServiceRequestForm = ({ propertyId, onSubmitted }: ServiceRequestFormProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [urgency, setUrgency] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handlePhotoAdd = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos((prev) => [...prev, ...Array.from(e.target.files!)].slice(0, 5));
    }
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !category) {
      toast.error("Please provide a title and category.");
      return;
    }
    setSubmitting(true);
    try {
      // Upload photos
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const path = `${propertyId}/service-requests/${Date.now()}-${photo.name}`;
        const { error } = await supabase.storage.from("report-images").upload(path, photo);
        if (!error) {
          const { data: signedReqData } = await supabase.storage.from("report-images").createSignedUrl(path, 3600);
          if (signedReqData?.signedUrl) photoUrls.push(signedReqData.signedUrl);
        }
      }

      // Create service request as a message + timeline event
      await supabase.from("property_messages").insert({
        property_id: propertyId,
        sender_id: user!.id,
        message: `🔧 SERVICE REQUEST: ${title}\nCategory: ${category}${urgency ? "\n⚠️ URGENT" : ""}\n\n${description}${photoUrls.length > 0 ? "\n\nPhotos attached: " + photoUrls.length : ""}`,
      });

      // Log to timeline
      await supabase.from("client_timeline_events").insert({
        client_id: user!.id,
        event_type: "service_request",
        event_description: `Service request: ${title} (${category})${urgency ? " — URGENT" : ""}`,
        actor: "client",
        metadata_json: { category, urgency, photo_count: photoUrls.length },
      });

      setSubmitted(true);
      toast.success("Service request submitted!");
      onSubmitted?.();
    } catch (err) {
      toast.error("Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-10 h-10 text-accent mx-auto mb-3" />
        <h3 className="font-display text-lg text-foreground mb-1">Request Submitted</h3>
        <p className="font-sans text-sm text-muted-foreground">Your advisor will review and respond shortly.</p>
        <Button variant="outline" size="sm" className="mt-4 font-sans text-xs" onClick={() => {
          setSubmitted(false); setTitle(""); setDescription(""); setCategory(""); setPhotos([]); setUrgency(false);
        }}>
          Submit Another
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Leaking faucet in kitchen" className="font-sans text-sm" />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="font-sans text-sm"><SelectValue placeholder="Select system" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Description</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue..." rows={3} className="font-sans text-sm" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="relative cursor-pointer">
            <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoAdd} />
            <Button variant="outline" size="sm" className="gap-1.5 font-sans text-xs" asChild>
              <span><Camera className="w-3.5 h-3.5" /> Add Photos ({photos.length}/5)</span>
            </Button>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-3.5 h-3.5 ${urgency ? "text-destructive" : "text-muted-foreground/40"}`} />
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Urgent</span>
          <Switch checked={urgency} onCheckedChange={setUrgency} />
        </div>
      </div>

      {photos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {photos.map((p, i) => (
            <div key={i} className="w-16 h-16 rounded bg-muted flex items-center justify-center overflow-hidden">
              <img src={URL.createObjectURL(p)} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2 font-sans">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Submit Service Request
      </Button>
    </div>
  );
};

export default ServiceRequestForm;
