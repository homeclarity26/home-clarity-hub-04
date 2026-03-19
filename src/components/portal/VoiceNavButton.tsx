import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, Loader2, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceNavButtonProps {
  propertyId: string;
  currentPage: string;
  onNavigate: (tab: string, subDestination?: string) => void;
}

type VoiceState = "idle" | "listening" | "processing";

// Check browser support
const hasSpeechRecognition = typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
const hasSpeechSynthesis = typeof window !== "undefined" && "speechSynthesis" in window;

const VoiceNavButton = ({ propertyId, currentPage, onNavigate }: VoiceNavButtonProps) => {
  const [state, setState] = useState<VoiceState>("idle");
  const [answerPanel, setAnswerPanel] = useState<{ text: string; source?: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Don't render if browser doesn't support speech recognition
  if (!hasSpeechRecognition) return null;

  // Check if suggestions were dismissed
  useEffect(() => {
    const d = localStorage.getItem(`voice-suggestions-dismissed-${propertyId}`);
    if (d) setDismissed(true);
  }, [propertyId]);

  const dismissSuggestions = () => {
    setShowSuggestions(false);
    setDismissed(true);
    localStorage.setItem(`voice-suggestions-dismissed-${propertyId}`, "true");
  };

  // Waveform animation
  const startWaveform = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas || !analyserRef.current) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const bufLen = analyserRef.current.frequencyBinCount;
        const data = new Uint8Array(bufLen);
        analyserRef.current.getByteFrequencyData(data);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = canvas.width / bufLen;
        const mid = canvas.height / 2;

        ctx.fillStyle = "hsl(var(--primary))";
        for (let i = 0; i < bufLen; i++) {
          const barHeight = (data[i] / 255) * mid;
          ctx.fillRect(i * barWidth, mid - barHeight, barWidth - 1, barHeight * 2);
        }

        animFrameRef.current = requestAnimationFrame(draw);
      };
      draw();
    } catch {
      // Mic access denied — continue without waveform
    }
  }, []);

  const stopWaveform = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const speak = useCallback((text: string) => {
    if (!hasSpeechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    // Try to find a calm voice
    const voices = speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google")) || voices.find(v => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;
    speechSynthesis.speak(utterance);
  }, []);

  const processCommand = useCallback(async (transcript: string) => {
    setState("processing");
    stopWaveform();

    try {
      const { data, error } = await supabase.functions.invoke("voice-command", {
        body: { client_id: propertyId, transcript, current_page: currentPage },
      });

      if (error) throw error;

      // Show toast with response
      toast.success(data.spoken_response, { duration: 5000 });

      // Speak the response
      speak(data.spoken_response);

      // Handle by type
      if (data.type === "navigate" && data.destination) {
        setTimeout(() => {
          onNavigate(data.destination, data.sub_destination);
        }, 1500);
      } else if (data.type === "answer") {
        setAnswerPanel({
          text: data.answer_text || data.spoken_response,
          source: data.answer_source,
        });
      } else if (data.type === "action") {
        // For actions, navigate to the relevant tab
        if (data.action_type === "compose_message") {
          onNavigate("messages");
        } else if (data.action_type === "add_goal") {
          onNavigate("home");
        }
      }
    } catch (err: any) {
      toast.error("Voice command failed. Please try again.");
      console.error(err);
    } finally {
      setState("idle");
    }
  }, [propertyId, currentPage, onNavigate, speak, stopWaveform]);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      processCommand(transcript);
    };

    recognition.onerror = () => {
      setState("idle");
      stopWaveform();
    };

    recognition.onend = () => {
      if (state === "listening") {
        // If still in listening state when ended, it timed out
        setState("idle");
        stopWaveform();
      }
    };

    recognition.onspeechend = () => {
      // Auto-stop after speech ends
      silenceTimerRef.current = setTimeout(() => {
        recognition.stop();
      }, 2000);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState("listening");
    startWaveform();
    setShowSuggestions(false);
  }, [processCommand, startWaveform, stopWaveform, state]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setState("idle");
    stopWaveform();
  }, [stopWaveform]);

  const toggleVoice = useCallback(() => {
    if (state === "listening") {
      stopListening();
    } else if (state === "idle") {
      startListening();
    }
  }, [state, startListening, stopListening]);

  // Keyboard shortcut: Space to activate (only when not typing)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        if (state === "idle") {
          e.preventDefault();
          startListening();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state, startListening]);

  const suggestedCommands = [
    "Show me my roof report",
    "What warranties are expiring soon?",
    "What should I budget for next year?",
    "Send my advisor a message",
  ];

  return (
    <div className="relative">
      {/* Voice Button */}
      <button
        onClick={toggleVoice}
        onMouseEnter={() => { if (!dismissed && state === "idle") setShowSuggestions(true); }}
        onMouseLeave={() => setShowSuggestions(false)}
        className={cn(
          "relative p-2 rounded-md transition-all border-none cursor-pointer",
          state === "idle" && "bg-transparent text-muted-foreground hover:text-foreground",
          state === "listening" && "bg-destructive/10 text-destructive",
          state === "processing" && "bg-primary/10 text-primary pointer-events-none",
        )}
        title="Voice Navigation — Press Space to activate"
        disabled={state === "processing"}
      >
        {state === "processing" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : state === "listening" ? (
          <div className="relative">
            <Mic className="w-4 h-4" />
            {/* Pulse animation */}
            <span className="absolute inset-0 rounded-full animate-ping bg-destructive/30" />
          </div>
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {/* State label */}
      {state !== "idle" && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap">
          <span className={cn(
            "text-[10px] font-sans font-medium px-2 py-0.5 rounded-full",
            state === "listening" && "bg-destructive/10 text-destructive",
            state === "processing" && "bg-primary/10 text-primary",
          )}>
            {state === "listening" ? "Listening..." : "Thinking..."}
          </span>
        </div>
      )}

      {/* Waveform canvas (shown during listening) */}
      {state === "listening" && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-6">
          <canvas ref={canvasRef} width={120} height={32} className="rounded bg-card border border-border shadow-sm" />
        </div>
      )}

      {/* Suggestions tooltip */}
      {showSuggestions && state === "idle" && !dismissed && (
        <Card className="absolute top-full right-0 mt-2 p-3 w-64 z-50 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-sans font-semibold text-foreground">Try saying...</span>
            <button onClick={dismissSuggestions} className="text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1.5">
            {suggestedCommands.map((cmd, i) => (
              <p key={i} className="text-[11px] font-sans text-muted-foreground italic">"{cmd}"</p>
            ))}
          </div>
          <p className="text-[9px] font-sans text-muted-foreground mt-2 border-t border-border pt-1.5">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-[8px] font-mono">Space</kbd> to activate voice
          </p>
        </Card>
      )}

      {/* Answer panel */}
      {answerPanel && (
        <Card className="absolute top-full right-0 mt-2 p-4 w-80 z-50 shadow-lg">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-sans font-semibold text-foreground">Answer</span>
            </div>
            <button onClick={() => setAnswerPanel(null)} className="text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-sm font-sans text-foreground">{answerPanel.text}</p>
          {answerPanel.source && (
            <p className="text-[10px] font-sans text-muted-foreground mt-2">Source: {answerPanel.source}</p>
          )}
        </Card>
      )}
    </div>
  );
};

export default VoiceNavButton;
