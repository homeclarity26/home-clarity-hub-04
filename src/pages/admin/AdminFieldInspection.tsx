import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, Camera, Mic, MicOff, MapPin, CheckCircle2, XCircle,
  Loader2, Upload, Clock, Navigation, Image as ImageIcon, FileText,
  StopCircle, Play, Trash2, Sparkles, ChevronDown, ChevronUp
} from "lucide-react";

const GEOFENCE_RADIUS_METERS = 200;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const AdminFieldInspection = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Core state
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"pending" | "verifying" | "verified" | "failed">("pending");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Camera state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<{ url: string; caption: string; pageId: string }[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPageForPhoto, setSelectedPageForPhoto] = useState<string>("");

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [processingVoice, setProcessingVoice] = useState(false);
  const [voiceNotes, setVoiceNotes] = useState<{ id: string; transcription: string; narrative: string; condition: string; pageId: string; observations: string[] }[]>([]);
  const [selectedPageForVoice, setSelectedPageForVoice] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Sections expand/collapse
  const [expandedSection, setExpandedSection] = useState<"gps" | "camera" | "voice" | "notes" | null>("gps");

  // Fetch property data
  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ["inspection-property", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, property_name, address, latitude, longitude, city, state")
        .eq("id", propertyId!)
        .single();
      return data;
    },
  });

  // Fetch report pages for assignment
  const { data: reportPages } = useQuery({
    queryKey: ["inspection-report-pages", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data: reports } = await supabase
        .from("reports")
        .select("id")
        .eq("property_id", propertyId!)
        .limit(1);
      if (!reports?.length) return [];
      const { data: pages } = await supabase
        .from("report_pages")
        .select("id, title, page_key, group_name")
        .eq("report_id", reports[0].id)
        .order("sort_order");
      return pages || [];
    },
  });

  // Create inspection record on mount
  useEffect(() => {
    if (!propertyId || !profile?.user_id || inspectionId) return;
    const createInspection = async () => {
      const { data, error } = await supabase
        .from("field_inspections")
        .insert({ property_id: propertyId, admin_id: profile.user_id } as any)
        .select("id")
        .single();
      if (!error && data) setInspectionId((data as any).id);
    };
    createInspection();
  }, [propertyId, profile?.user_id, inspectionId]);

  // GPS check-in
  const handleGPSCheckIn = useCallback(() => {
    setGpsStatus("verifying");
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      setGpsStatus("failed");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGpsCoords(coords);

        const propertyLat = property?.latitude;
        const propertyLng = property?.longitude;

        let dist: number | null = null;
        let verified = false;

        if (propertyLat && propertyLng) {
          dist = haversineDistance(coords.lat, coords.lng, propertyLat, propertyLng);
          verified = dist <= GEOFENCE_RADIUS_METERS;
          setDistance(Math.round(dist));
        } else {
          // No property coords — accept GPS but can't verify
          verified = false;
          setDistance(null);
        }

        // Update inspection record
        if (inspectionId) {
          await supabase
            .from("field_inspections")
            .update({
              gps_lat: coords.lat,
              gps_lng: coords.lng,
              gps_verified: verified,
              distance_meters: dist,
              checked_in_at: new Date().toISOString(),
            } as any)
            .eq("id", inspectionId);
        }

        setGpsStatus(verified ? "verified" : (propertyLat ? "failed" : "verified"));
        toast.success(verified ? "GPS verified — you're on site!" : (propertyLat ? `You're ${Math.round(dist!)}m away from the property` : "Location recorded"));
      },
      (err) => {
        toast.error(`GPS error: ${err.message}`);
        setGpsStatus("failed");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [property, inspectionId]);

  // Camera capture
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !inspectionId) return;
    setUploadingPhoto(true);

    try {
      const fileName = `inspections/${inspectionId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("report-images")
        .upload(fileName, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: signedInspData } = await supabase.storage.from("report-images").createSignedUrl(fileName, 3600);
      const inspPhotoUrl = signedInspData?.signedUrl || fileName;

      // Get current GPS for photo
      let photoLat: number | undefined;
      let photoLng: number | undefined;
      if (gpsCoords) {
        photoLat = gpsCoords.lat;
        photoLng = gpsCoords.lng;
      }

      await supabase.from("inspection_photos").insert({
        inspection_id: inspectionId,
        photo_url: inspPhotoUrl,
        report_page_id: selectedPageForPhoto || null,
        gps_lat: photoLat,
        gps_lng: photoLng,
      } as any);

      setPhotos((prev) => [...prev, { url: inspPhotoUrl, caption: "", pageId: selectedPageForPhoto }]);
      toast.success("Photo captured");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
    } catch (err: any) {
      toast.error(`Microphone error: ${err.message}`);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const processVoiceNote = async () => {
    if (!audioBlob || !inspectionId) return;
    setProcessingVoice(true);
    try {
      // Convert blob to base64
      const buffer = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);

      const selectedPage = reportPages?.find((p) => p.id === selectedPageForVoice);

      const { data, error } = await supabase.functions.invoke("voice-to-narrative", {
        body: {
          audioBase64: base64,
          mimeType: "audio/webm",
          pageSlug: selectedPage?.page_key || "general",
          pageName: selectedPage?.title || "General Notes",
          propertyContext: property ? { address: property.address, city: property.city, state: property.state } : undefined,
        },
      });

      if (error) throw error;

      // Save to DB
      const { data: saved } = await supabase.from("inspection_voice_notes").insert({
        inspection_id: inspectionId,
        transcription: data.transcription,
        ai_narrative: data.narrative?.join("\n\n") || data.transcription,
        report_page_id: selectedPageForVoice || null,
        condition_suggestion: data.condition_suggestion,
        key_observations: data.key_observations,
      } as any).select("id").single();

      setVoiceNotes((prev) => [
        ...prev,
        {
          id: (saved as any)?.id || Date.now().toString(),
          transcription: data.transcription,
          narrative: data.narrative?.join("\n\n") || data.transcription,
          condition: data.condition_suggestion || "",
          pageId: selectedPageForVoice,
          observations: data.key_observations || [],
        },
      ]);

      setAudioBlob(null);
      toast.success("Voice note processed with AI");
    } catch (err: any) {
      toast.error(`Processing failed: ${err.message}`);
    } finally {
      setProcessingVoice(false);
    }
  };

  // Save notes
  const saveNotes = async () => {
    if (!inspectionId) return;
    setSaving(true);
    const { error } = await supabase
      .from("field_inspections")
      .update({ notes } as any)
      .eq("id", inspectionId);
    setSaving(false);
    if (error) toast.error("Save failed");
    else toast.success("Notes saved");
  };

  // End inspection
  const endInspection = async () => {
    if (!inspectionId) return;
    await supabase
      .from("field_inspections")
      .update({ status: "completed", checked_out_at: new Date().toISOString(), notes } as any)
      .eq("id", inspectionId);

    // Log timeline event
    if (propertyId) {
      await supabase.from("client_timeline_events").insert({
        client_id: propertyId,
        event_type: "inspection",
        event_description: `Field inspection completed (${photos.length} photos, ${voiceNotes.length} voice notes)`,
        actor: profile?.full_name || "Admin",
        is_admin_note: true,
      });
    }

    toast.success("Inspection completed");
    navigate(`/admin/clients/${propertyId}`);
  };

  const toggleSection = (section: typeof expandedSection) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  if (propertyLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/clients/${propertyId}`)} className="gap-1 font-sans">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="text-center">
            <p className="text-sm font-sans font-semibold text-foreground truncate max-w-[180px]">{property?.property_name || "Inspection"}</p>
            <p className="text-[10px] font-sans text-muted-foreground">Field Mode</p>
          </div>
          <Badge variant={gpsStatus === "verified" ? "default" : "secondary"} className="text-[10px]">
            {gpsStatus === "verified" ? "On Site" : gpsStatus === "verifying" ? "..." : "Pending"}
          </Badge>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {/* GPS Check-In Section */}
        <Card className="border-border">
          <button onClick={() => toggleSection("gps")} className="w-full bg-transparent border-none cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <CardTitle className="text-sm font-sans">GPS Check-In</CardTitle>
                {gpsStatus === "verified" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                {gpsStatus === "failed" && <XCircle className="w-4 h-4 text-destructive" />}
              </div>
              {expandedSection === "gps" ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </CardHeader>
          </button>
          {expandedSection === "gps" && (
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              <p className="text-xs font-sans text-muted-foreground">
                Verify your location against the property address. Must be within {GEOFENCE_RADIUS_METERS}m.
              </p>
              {gpsCoords && (
                <div className="text-xs font-mono text-muted-foreground bg-muted rounded p-2">
                  <p>Lat: {gpsCoords.lat.toFixed(6)}</p>
                  <p>Lng: {gpsCoords.lng.toFixed(6)}</p>
                  {distance !== null && <p>Distance: {distance}m from property</p>}
                  {!property?.latitude && <p className="text-destructive mt-1">⚠ No property coordinates stored — location recorded but not verified</p>}
                </div>
              )}
              <Button
                onClick={handleGPSCheckIn}
                disabled={gpsStatus === "verifying"}
                className="w-full gap-2 font-sans"
                variant={gpsStatus === "verified" ? "outline" : "default"}
              >
                {gpsStatus === "verifying" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                {gpsStatus === "verified" ? "Re-verify Location" : gpsStatus === "failed" ? "Retry Check-In" : "Check In"}
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Camera Section */}
        <Card className="border-border">
          <button onClick={() => toggleSection("camera")} className="w-full bg-transparent border-none cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                <CardTitle className="text-sm font-sans">Photos</CardTitle>
                {photos.length > 0 && <Badge variant="secondary" className="text-[10px]">{photos.length}</Badge>}
              </div>
              {expandedSection === "camera" ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </CardHeader>
          </button>
          {expandedSection === "camera" && (
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {reportPages && reportPages.length > 0 && (
                <Select value={selectedPageForPhoto} onValueChange={setSelectedPageForPhoto}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Assign to report page (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">General</SelectItem>
                    {reportPages.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto || !inspectionId}
                className="w-full gap-2 font-sans"
              >
                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {uploadingPhoto ? "Uploading..." : "Take Photo"}
              </Button>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, i) => (
                    <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-border">
                      <img src={photo.url} alt={`Inspection photo ${i + 1}`} className="w-full h-full object-cover" />
                      {photo.pageId && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                          <p className="text-[8px] text-white truncate font-sans">
                            {reportPages?.find((p) => p.id === photo.pageId)?.title || "Page"}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Voice Notes Section */}
        <Card className="border-border">
          <button onClick={() => toggleSection("voice")} className="w-full bg-transparent border-none cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                <CardTitle className="text-sm font-sans">Voice Notes</CardTitle>
                {voiceNotes.length > 0 && <Badge variant="secondary" className="text-[10px]">{voiceNotes.length}</Badge>}
              </div>
              {expandedSection === "voice" ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </CardHeader>
          </button>
          {expandedSection === "voice" && (
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {reportPages && reportPages.length > 0 && (
                <Select value={selectedPageForVoice} onValueChange={setSelectedPageForVoice}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="For report page (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">General</SelectItem>
                    {reportPages.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex gap-2">
                {!isRecording && !audioBlob && (
                  <Button onClick={startRecording} className="flex-1 gap-2 font-sans" variant="default">
                    <Mic className="w-4 h-4" /> Start Recording
                  </Button>
                )}
                {isRecording && (
                  <Button onClick={stopRecording} className="flex-1 gap-2 font-sans" variant="destructive">
                    <StopCircle className="w-4 h-4" /> Stop Recording
                    <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
                  </Button>
                )}
                {audioBlob && !isRecording && (
                  <>
                    <Button onClick={processVoiceNote} disabled={processingVoice} className="flex-1 gap-2 font-sans">
                      {processingVoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {processingVoice ? "Processing..." : "Transcribe + AI"}
                    </Button>
                    <Button onClick={() => setAudioBlob(null)} variant="outline" size="icon">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>

              {voiceNotes.map((vn, i) => (
                <Card key={vn.id} className="border-border bg-muted/50">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-sans font-medium text-muted-foreground uppercase tracking-wider">
                        Voice Note #{i + 1}
                        {vn.pageId && ` · ${reportPages?.find((p) => p.id === vn.pageId)?.title}`}
                      </p>
                      {vn.condition && (
                        <Badge variant="outline" className="text-[10px]">{vn.condition}</Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-sans text-muted-foreground mb-1">Transcription:</p>
                      <p className="text-xs font-sans text-foreground">{vn.transcription}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-sans text-muted-foreground mb-1">AI Narrative:</p>
                      <p className="text-xs font-sans text-foreground whitespace-pre-line">{vn.narrative}</p>
                    </div>
                    {vn.observations.length > 0 && (
                      <div>
                        <p className="text-[10px] font-sans text-muted-foreground mb-1">Key Observations:</p>
                        <ul className="text-xs font-sans text-foreground space-y-0.5">
                          {vn.observations.map((o, j) => (
                            <li key={j} className="flex items-start gap-1">
                              <span className="text-primary mt-0.5">•</span> {o}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          )}
        </Card>

        {/* Field Notes Section */}
        <Card className="border-border">
          <button onClick={() => toggleSection("notes")} className="w-full bg-transparent border-none cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle className="text-sm font-sans">Field Notes</CardTitle>
              </div>
              {expandedSection === "notes" ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </CardHeader>
          </button>
          {expandedSection === "notes" && (
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type field observations, reminders, follow-up items..."
                className="min-h-[120px] text-sm font-sans"
              />
              <Button onClick={saveNotes} disabled={saving} variant="outline" className="w-full gap-2 font-sans" size="sm">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Save Notes
              </Button>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="text-xs font-sans text-muted-foreground">
            <span className="font-medium text-foreground">{photos.length}</span> photos ·{" "}
            <span className="font-medium text-foreground">{voiceNotes.length}</span> voice notes
          </div>
          <Button onClick={endInspection} className="gap-2 font-sans" size="sm">
            <CheckCircle2 className="w-4 h-4" /> End Inspection
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminFieldInspection;
