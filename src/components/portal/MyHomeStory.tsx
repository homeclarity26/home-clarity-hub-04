import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Home, Shield, FileText, Clock, Wrench, Building, Upload,
  ChevronRight, Loader2, AlertTriangle, CheckCircle2, Sparkles
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

interface Props {
  propertyId: string;
  propertyName?: string;
}

const MyHomeStory = ({ propertyId, propertyName = "Your Home" }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  // Load counts from each table
  const { data: counts } = useQuery({
    queryKey: ["home-story-counts", propertyId],
    queryFn: async () => {
      const [eq, kb, tl, wr, pr, sr, ss] = await Promise.all([
        supabase.from("equipment").select("id", { count: "exact", head: true }).eq("property_id", propertyId),
        supabase.from("home_knowledge_base").select("id", { count: "exact", head: true }).eq("client_id", propertyId).eq("is_current", true),
        supabase.from("property_timeline").select("id", { count: "exact", head: true }).eq("client_id", propertyId),
        supabase.from("warranty_registry").select("id", { count: "exact", head: true }).eq("client_id", propertyId),
        supabase.from("permit_registry").select("id", { count: "exact", head: true }).eq("client_id", propertyId),
        supabase.from("service_history").select("id", { count: "exact", head: true }).eq("client_id", propertyId),
        supabase.from("structural_specifications").select("id", { count: "exact", head: true }).eq("client_id", propertyId),
      ]);
      return {
        equipment: eq.count || 0, knowledge: kb.count || 0, timeline: tl.count || 0,
        warranties: wr.count || 0, permits: pr.count || 0, service: sr.count || 0, specs: ss.count || 0,
      };
    },
  });

  // Timeline events
  const { data: timeline } = useQuery({
    queryKey: ["home-story-timeline", propertyId],
    queryFn: async () => {
      const { data } = await supabase.from("property_timeline").select("*")
        .eq("client_id", propertyId).order("event_date", { ascending: false }).limit(20);
      return data || [];
    },
  });

  // Expiring warranties
  const { data: expiringWarranties } = useQuery({
    queryKey: ["home-story-warranties", propertyId],
    queryFn: async () => {
      const { data } = await supabase.from("warranty_registry").select("*")
        .eq("client_id", propertyId).eq("is_active", true).order("expiration_date");
      return (data || []).filter(w => {
        if (!w.expiration_date) return false;
        const days = differenceInDays(new Date(w.expiration_date), new Date());
        return days >= 0 && days <= 365;
      });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `files/${propertyId}/${Date.now()}.${file.name.split(".").pop()}`;
      const { error: ue } = await supabase.storage.from("report-images").upload(path, file);
      if (ue) throw ue;

      const { data: signedStoryData } = await supabase.storage.from("report-images").createSignedUrl(path, 3600);
      const storyFileUrl = signedStoryData?.signedUrl || path;

      // Save file record
      await supabase.from("client_files").insert({
        property_id: propertyId, file_name: file.name, storage_path: path,
        file_type: file.type.startsWith("image/") ? "image" : "document",
        file_size: file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        category: "General",
      });

      // Trigger AI processing
      toast.info("Reading document...");
      const { data, error } = await supabase.functions.invoke("process-document", {
        body: { client_id: propertyId, file_url: storyFileUrl, file_type: file.type },
      });

      if (error) throw error;
      toast.success(`Document processed — ${data.items_created} new records added to your home's knowledge base`);
      qc.invalidateQueries({ queryKey: ["home-story-counts", propertyId] });
      qc.invalidateQueries({ queryKey: ["home-story-timeline", propertyId] });
      qc.invalidateQueries({ queryKey: ["home-story-warranties", propertyId] });
    } catch (err: any) {
      toast.error("Upload failed");
      console.error(err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const typeColors: Record<string, string> = {
    renovation: "bg-blue-500", repair: "bg-amber-500", purchase: "bg-emerald-500",
    permit: "bg-purple-500", inspection: "bg-cyan-500", appliance_install: "bg-indigo-500",
    service: "bg-orange-500", damage: "bg-red-500",
  };

  const topicCards = [
    { icon: Building, label: "Structure & Materials", count: counts?.specs || 0 },
    { icon: Wrench, label: "Systems & Equipment", count: counts?.equipment || 0 },
    { icon: Clock, label: "Renovation History", count: counts?.timeline || 0 },
    { icon: Shield, label: "Warranties", count: counts?.warranties || 0 },
    { icon: FileText, label: "Permits", count: counts?.permits || 0 },
    { icon: Wrench, label: "Service Records", count: counts?.service || 0 },
  ];

  const totalRecords = Object.values(counts || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <input type="file" ref={fileRef} className="hidden" onChange={handleUpload} />

      {/* Hero */}
      <Card className="p-6 bg-gradient-to-br from-[hsl(var(--primary)/0.08)] to-[hsl(var(--primary)/0.02)] border-primary/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Home className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-sans font-bold text-foreground">My Home's Story</h3>
            <p className="text-xs text-muted-foreground font-sans">{totalRecords} records in your home's digital record</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-sans">
          Your home has a story. Every repair, upgrade, and maintenance event is part of it.
          The more complete your home's record, the more valuable it becomes.
        </p>
      </Card>

      {/* What We Know Topic Cards */}
      <div>
        <h4 className="text-sm font-sans font-semibold text-foreground mb-3">What We Know About Your Home</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {topicCards.map(({ icon: Icon, label, count }) => (
            <Card key={label} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-primary/60" />
                <span className="text-xs font-sans font-medium text-foreground">{label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-sans font-bold text-foreground">{count}</span>
                <span className="text-[10px] text-muted-foreground font-sans">records</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Warranty Watchlist */}
      {(expiringWarranties || []).length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-sans font-semibold text-foreground">Warranty Watchlist</h4>
          </div>
          <div className="space-y-2">
            {(expiringWarranties || []).slice(0, 5).map((w) => {
              const daysLeft = w.expiration_date ? differenceInDays(new Date(w.expiration_date), new Date()) : 0;
              return (
                <div key={w.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm font-sans text-foreground">{w.item_name}</span>
                    {w.manufacturer && <span className="text-xs text-muted-foreground font-sans ml-2">{w.manufacturer}</span>}
                  </div>
                  <Badge variant={daysLeft < 90 ? "destructive" : "secondary"} className="text-[10px]">
                    {daysLeft} days left
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Property Timeline */}
      {(timeline || []).length > 0 && (
        <Card className="p-5">
          <h4 className="text-sm font-sans font-semibold text-foreground mb-4">Your Home's Timeline</h4>
          <div className="relative ml-3 border-l-2 border-border space-y-4 pl-5">
            {(timeline || []).slice(0, 10).map((ev) => (
              <div key={ev.id} className="relative">
                <div className={`absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full ${typeColors[ev.event_type] || "bg-muted-foreground"}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-sans font-medium text-foreground">{ev.title}</span>
                    {ev.verified && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  </div>
                  {ev.description && <p className="text-xs text-muted-foreground font-sans mt-0.5">{ev.description}</p>}
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-sans">
                    <span>{format(new Date(ev.event_date), "MMM d, yyyy")}</span>
                    {ev.cost && <span>· ${Number(ev.cost).toLocaleString()}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upload Prompt */}
      <Card className="p-6 border-dashed border-2 border-primary/20 bg-primary/[0.02] text-center">
        <Upload className="w-8 h-8 text-primary/40 mx-auto mb-3" />
        <h4 className="text-sm font-sans font-semibold text-foreground mb-1">Add to Your Home's Story</h4>
        <p className="text-xs text-muted-foreground font-sans mb-4 max-w-md mx-auto">
          Upload old inspection reports, appliance manuals, receipts, warranty cards, permits, or
          any document about your home. We'll read it automatically and add the details to your permanent record.
        </p>
        <Button className="gap-2 text-xs font-sans" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Processing..." : "Upload Documents"}
        </Button>
      </Card>
    </div>
  );
};

export default MyHomeStory;
