import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { hcr, hcrFonts } from "./brand";

export const FPS = 30;

interface Shot {
  file: string;
  /** seconds into the recording to start */
  from: number;
  /** seconds on screen */
  dur: number;
  eyebrow: string;
  caption: string;
}

// 45 seconds = 1350 frames. Title 3s, eight shots 38s, close 4s.
export const SHOTS: Shot[] = [
  { file: "home.webm",     from: 1.2, dur: 4.5, eyebrow: "The client portal",      caption: "Every client gets a private portal for their home." },
  { file: "report.webm",   from: 1.0, dur: 3.5, eyebrow: "The report",             caption: "Organized in five chapters, built to be read." },
  { file: "kitchen.webm",  from: 1.2, dur: 5.0, eyebrow: "Every room",             caption: "Finishes, fixtures and condition, documented room by room." },
  { file: "furnace.webm",  from: 1.0, dur: 7.0, eyebrow: "Every system",           caption: "Age, lifecycle, and a replacement plan priced before it fails." },
  { file: "vision.webm",   from: 1.2, dur: 5.0, eyebrow: "Vision projects",        caption: "Three investment tiers, scoped and ready when you are." },
  { file: "services.webm", from: 1.4, dur: 4.0, eyebrow: "Recurring services",     caption: "Every vendor, cost and due date, in one place." },
  { file: "plan.webm",     from: 1.4, dur: 3.5, eyebrow: "The ten-year plan",      caption: "Defense, offense, expansion. Never a surprise." },
  { file: "bobby.webm",    from: 0.8, dur: 5.5, eyebrow: "Bobby, your assistant",  caption: "Answers from your home's own record, any time." },
];

const TITLE_SEC = 3;
const CLOSE_SEC = 4;
export const TOTAL_FRAMES = Math.round((TITLE_SEC + SHOTS.reduce((a, s) => a + s.dur, 0) + CLOSE_SEC) * FPS);

const Seal: React.FC<{ size: number }> = ({ size }) => (
  <Img src={staticFile("brand/hbc-seal-gold.svg")} style={{ width: size, height: size }} />
);

const fadeInOut = (frame: number, total: number, edge = 9) =>
  interpolate(frame, [0, edge, total - edge, total], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 200 } });
  const op = fadeInOut(frame, TITLE_SEC * FPS, 8);
  return (
    <AbsoluteFill style={{ background: hcr.navy, opacity: op, alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: s(0), transform: `scale(${interpolate(s(0), [0, 1], [0.9, 1])})` }}>
        <Seal size={150} />
      </div>
      <div style={{ marginTop: 34, fontFamily: hcrFonts.mono, fontSize: 18, letterSpacing: "0.22em", textTransform: "uppercase", color: hcr.gold, opacity: s(8) }}>
        Hometown Builders Club presents
      </div>
      <div style={{ marginTop: 14, fontFamily: hcrFonts.display, fontWeight: 500, fontSize: 96, color: hcr.white, lineHeight: 1.05, opacity: s(14), transform: `translateY(${interpolate(s(14), [0, 1], [18, 0])}px)` }}>
        The Home Clarity Report
      </div>
      <div style={{ marginTop: 18, fontFamily: hcrFonts.body, fontSize: 28, color: hcr.muted, opacity: s(24) }}>
        Every room. Every system. One living record of your home.
      </div>
    </AbsoluteFill>
  );
};

const ShotScene: React.FC<{ shot: Shot }> = ({ shot }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = Math.round(shot.dur * FPS);
  const op = fadeInOut(frame, total, 8);
  const cap = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  const zoom = interpolate(frame, [0, total], [1.0, 1.02]);
  return (
    <AbsoluteFill style={{ background: hcr.navy, opacity: op }}>
      {/* Browser frame */}
      <div style={{ position: "absolute", left: 100, right: 100, top: 54, bottom: 150, borderRadius: 14, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.45)", border: `1px solid ${hcr.navySoft}` }}>
        <div style={{ width: "100%", height: "100%", transform: `scale(${zoom})`, transformOrigin: "50% 30%" }}>
          <OffthreadVideo
            src={staticFile(`clips/${shot.file}`)}
            startFrom={Math.round(shot.from * FPS)}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          />
        </div>
      </div>
      {/* Caption */}
      <div style={{ position: "absolute", left: 100, right: 100, bottom: 46, display: "flex", alignItems: "flex-end", justifyContent: "space-between", opacity: cap, transform: `translateY(${interpolate(cap, [0, 1], [12, 0])}px)` }}>
        <div>
          <div style={{ fontFamily: hcrFonts.mono, fontSize: 15, letterSpacing: "0.2em", textTransform: "uppercase", color: hcr.gold }}>{shot.eyebrow}</div>
          <div style={{ marginTop: 6, fontFamily: hcrFonts.display, fontWeight: 500, fontSize: 40, color: hcr.white }}>{shot.caption}</div>
        </div>
        <Seal size={54} />
      </div>
    </AbsoluteFill>
  );
};

const CloseCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (d: number) => spring({ frame: frame - d, fps, config: { damping: 200 } });
  const op = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: hcr.navy, opacity: op, alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: hcrFonts.mono, fontSize: 18, letterSpacing: "0.22em", textTransform: "uppercase", color: hcr.gold, opacity: s(0) }}>
        See the sample report
      </div>
      <div style={{ marginTop: 16, fontFamily: hcrFonts.display, fontWeight: 500, fontSize: 76, color: hcr.white, opacity: s(6) }}>
        home-clarity-hub.vercel.app/demo
      </div>
      <div style={{ width: interpolate(s(14), [0, 1], [0, 220]), height: 3, background: hcr.gold, marginTop: 30, marginBottom: 30, borderRadius: 2 }} />
      <div style={{ fontFamily: hcrFonts.body, fontSize: 30, color: hcr.cream, opacity: s(18) }}>
        Ready for your own? adam@hometownbuildersclub.com
      </div>
      <div style={{ position: "absolute", bottom: 56, display: "flex", alignItems: "center", gap: 18, opacity: s(26) }}>
        <Seal size={64} />
        <div style={{ fontFamily: hcrFonts.mono, fontSize: 15, letterSpacing: "0.2em", textTransform: "uppercase", color: hcr.muted }}>Hometown Builders Club · Cuyahoga Falls, Ohio</div>
      </div>
    </AbsoluteFill>
  );
};

export const Demo45: React.FC = () => {
  let at = 0;
  const seqs: React.ReactNode[] = [];
  seqs.push(<Sequence key="title" from={0} durationInFrames={TITLE_SEC * FPS}><TitleCard /></Sequence>);
  at += TITLE_SEC * FPS;
  for (const shot of SHOTS) {
    const d = Math.round(shot.dur * FPS);
    seqs.push(<Sequence key={shot.file} from={at} durationInFrames={d}><ShotScene shot={shot} /></Sequence>);
    at += d;
  }
  seqs.push(<Sequence key="close" from={at} durationInFrames={CLOSE_SEC * FPS}><CloseCard /></Sequence>);
  return <AbsoluteFill style={{ background: hcr.navy }}>{seqs}</AbsoluteFill>;
};
