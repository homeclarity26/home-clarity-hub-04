import { useState } from "react";
import { Play, Video, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface VideoMessageBubbleProps {
  url: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
}

function extractVideoEmbed(url: string): { embedUrl: string; type: string } | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`, type: "youtube" };

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`, type: "vimeo" };

  // Loom
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return { embedUrl: `https://www.loom.com/embed/${loomMatch[1]}?autoplay=1`, type: "loom" };

  return null;
}

function getThumbnail(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;

  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://cdn.loom.com/sessions/thumbnails/${loomMatch[1]}-with-play.gif`;

  return null;
}

const VideoMessageBubble = ({ url, senderName, timestamp, isOwn }: VideoMessageBubbleProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const embed = extractVideoEmbed(url);
  const thumbnail = getThumbnail(url);

  return (
    <>
      <div className={`max-w-[72%] space-y-1 flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        <button
          onClick={() => setLightboxOpen(true)}
          className="relative rounded-xl overflow-hidden border border-border cursor-pointer bg-muted group w-full max-w-[320px]"
        >
          {thumbnail ? (
            <img src={thumbnail} alt="Video thumbnail" className="w-full h-auto object-cover" />
          ) : (
            <div className="w-full h-[180px] flex items-center justify-center bg-muted">
              <Video className="w-10 h-10 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/20 group-hover:bg-foreground/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-background/90 flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 text-foreground ml-0.5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/60 to-transparent p-3">
            <div className="flex items-center gap-1.5">
              <Video className="w-3 h-3 text-background" />
              <span className="text-[10px] font-sans text-background font-medium">📹 Video Message</span>
            </div>
          </div>
        </button>
        <span className="text-[10px] font-sans text-muted-foreground px-1">
          {senderName} · {timestamp}
        </span>
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-foreground border-none">
          {embed ? (
            <iframe
              src={embed.embedUrl}
              className="w-full aspect-video"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            />
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-background font-sans">Unable to embed this video. <a href={url} target="_blank" rel="noopener noreferrer" className="text-accent underline">Open in new tab</a></p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VideoMessageBubble;
