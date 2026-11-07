import {
  AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { hcr, hcrFonts } from "./brand";

export const VFPS = 30;
export const V_TOTAL = 55 * VFPS;
const f = (sec: number) => Math.round(sec * VFPS);

// Timeline (seconds). Voiceover segment k starts at VO[k].
const T = { hook: [0, 4], problem: [4, 12], expert: [12, 22.5], product: [22.5, 37], offer: [37, 48.5], cta: [48.5, 55] } as const;
const VO = [0.6, 4.3, 12.4, 22.8, 37.3, 49.0];

export interface VerticalProps { voiceover: boolean }

const Seal: React.FC<{ size: number }> = ({ size }) => (
  <Img src={staticFile("brand/hbc-seal-gold.svg")} style={{ width: size, height: size }} />
);

const useS = () => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return (delay: number) => spring({ frame: frame - delay, fps, config: { damping: 200 } }); };
const fadeOut = (frame: number, total: number, edge = 10) => interpolate(frame, [total - edge, total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** Full-bleed photo with slow push-in and a navy gradient for legible text. */
const Photo: React.FC<{ src: string; from?: number; to?: number; pos?: string }> = ({ src, from = 1.0, to = 1.08, pos = "center" }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 300], [from, to], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: hcr.navy }}>
      <Img src={staticFile(`photos/${src}`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: `scale(${scale})` }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${hcr.navy}cc 0%, ${hcr.navy}22 35%, ${hcr.navy}33 65%, ${hcr.navy}f2 100%)` }} />
    </AbsoluteFill>
  );
};

const Eyebrow: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily: hcrFonts.mono, fontSize: 24, letterSpacing: "0.22em", textTransform: "uppercase", color: hcr.gold, ...style }}>{children}</div>
);
const Big: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({ children, size = 92, style }) => (
  <div style={{ fontFamily: hcrFonts.display, fontWeight: 500, fontSize: size, lineHeight: 1.06, color: hcr.white, ...style }}>{children}</div>
);

// 1. Hook
const Hook: React.FC = () => {
  const s = useS(); const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: fadeOut(frame, f(T.hook[1] - T.hook[0])) }}>
      <Photo src="exterior-front.jpg" />
      <div style={{ position: "absolute", left: 90, right: 90, bottom: 260 }}>
        <Eyebrow style={{ opacity: s(4) }}>Summit County, Ohio</Eyebrow>
        <Big style={{ marginTop: 22, opacity: s(10), transform: `translateY(${interpolate(s(10), [0, 1], [24, 0])}px)` }}>You own a beautiful, complex home.</Big>
      </div>
    </AbsoluteFill>
  );
};

// 2. Problem: four questions stack over quick photo cuts
const Problem: React.FC = () => {
  const s = useS(); const frame = useCurrentFrame(); const total = f(T.problem[1] - T.problem[0]);
  const lines = ["How was it built?", "What should the furnace cost to replace?", "What do you fix first?", "Who do you trust to do the work?"];
  const photos = [["roof-detail.jpg", 0], ["mechanical-room.jpg", f(2.7)], ["furnace-serial-plate.jpg", f(5.4)]] as const;
  return (
    <AbsoluteFill style={{ opacity: fadeOut(frame, total) }}>
      {photos.map(([src, from], i) => (
        <Sequence key={src} from={from} durationInFrames={i < 2 ? f(2.7) + 8 : total - from} layout="none">
          <Photo src={src} from={1.04} to={1.12} />
        </Sequence>
      ))}
      <div style={{ position: "absolute", left: 90, right: 90, bottom: 230 }}>
        <Eyebrow style={{ opacity: s(0) }}>Nobody handed you the manual</Eyebrow>
        {lines.map((l, i) => { const d = 14 + i * 44; return (
          <Big key={l} size={74} style={{ marginTop: i === 0 ? 24 : 14, opacity: s(d), transform: `translateX(${interpolate(s(d), [0, 1], [-20, 0])}px)` }}>{l}</Big>
        ); })}
      </div>
    </AbsoluteFill>
  );
};

// 3. The human expert
const Expert: React.FC = () => {
  const s = useS(); const frame = useCurrentFrame(); const total = f(T.expert[1] - T.expert[0]);
  return (
    <AbsoluteFill style={{ opacity: fadeOut(frame, total) }}>
      <Photo src="advisor-inspect.jpg" from={1.0} to={1.1} pos="70% center" />
      <div style={{ position: "absolute", left: 90, right: 90, bottom: 230 }}>
        <Eyebrow style={{ opacity: s(0) }}>A real, local expert</Eyebrow>
        <Big style={{ marginTop: 22, opacity: s(8) }}>I'm Adam.</Big>
        <Big size={64} style={{ marginTop: 10, opacity: s(40), color: hcr.cream }}>27 years inside Summit County homes.</Big>
        <Big size={64} style={{ marginTop: 10, opacity: s(150), color: hcr.cream }}>Hours in yours, learning how it was built and how your family lives.</Big>
      </div>
    </AbsoluteFill>
  );
};

// 4. Product: phone mockup with four clips in sync with the voiceover
interface VClip { file: string; from: number; at: number; dur: number; eyebrow: string; caption: string }
const CLIPS: VClip[] = [
  { file: "report.mp4",  from: 1.4, at: 0,    dur: 4.5, eyebrow: "Your Home Clarity Report", caption: "Every room and every system, documented." },
  { file: "furnace.mp4", from: 1.9, at: 4.5,  dur: 3.3, eyebrow: "Every system",            caption: "Every replacement priced before it fails." },
  { file: "plan.mp4",    from: 1.4, at: 7.8,  dur: 3.0, eyebrow: "The ten-year plan",       caption: "The next ten years, in the right order." },
  { file: "bobby.mp4",   from: 1.2, at: 10.8, dur: 3.7, eyebrow: "Bobby",                   caption: "Answers from your home's own record." },
];
const PhoneClip: React.FC<{ clip: VClip }> = ({ clip }) => {
  const s = useS(); const frame = useCurrentFrame(); const total = f(clip.dur);
  const op = interpolate(frame, [0, 6, total - 6, total], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div style={{ position: "absolute", left: 80, right: 80, top: 150 }}>
        <Eyebrow style={{ opacity: s(2) }}>{clip.eyebrow}</Eyebrow>
        <Big size={60} style={{ marginTop: 14, opacity: s(6) }}>{clip.caption}</Big>
      </div>
      <div style={{ position: "absolute", left: 210, right: 210, top: 410, height: 1428, borderRadius: 60, overflow: "hidden", border: `10px solid #11213a`, boxShadow: "0 40px 90px rgba(0,0,0,0.55)", background: "#000" }}>
        <OffthreadVideo src={staticFile(`vclips/${clip.file}`)} startFrom={Math.round(clip.from * VFPS)} muted style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
      </div>
    </AbsoluteFill>
  );
};
const Product: React.FC = () => (
  <AbsoluteFill style={{ background: hcr.navy }}>
    {CLIPS.map((c) => (
      <Sequence key={c.file} from={f(c.at)} durationInFrames={f(c.dur)} layout="none"><PhoneClip clip={c} /></Sequence>
    ))}
  </AbsoluteFill>
);

// 5. The offer
const Offer: React.FC = () => {
  const s = useS(); const frame = useCurrentFrame(); const total = f(T.offer[1] - T.offer[0]);
  const lines = [
    ["Your concierge for every repair, project and question.", 70],
    ["For as long as you own the home.", 170],
    ["And it transfers to the next owner.", 240],
  ] as const;
  return (
    <AbsoluteFill style={{ background: hcr.navy, opacity: fadeOut(frame, total), padding: "0 90px", justifyContent: "center" }}>
      <Eyebrow style={{ opacity: s(0) }}>The Home Clarity Report</Eyebrow>
      <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 20, opacity: s(6), transform: `scale(${interpolate(s(6), [0, 1], [0.94, 1])})`, transformOrigin: "left" }}>
        <div style={{ fontFamily: hcrFonts.display, fontWeight: 500, fontSize: 170, color: hcr.white, lineHeight: 1 }}>$4,500</div>
        <div style={{ fontFamily: hcrFonts.display, fontSize: 64, color: hcr.gold }}>once.</div>
      </div>
      <div style={{ width: interpolate(s(20), [0, 1], [0, 180]), height: 4, background: hcr.gold, margin: "34px 0 30px", borderRadius: 2 }} />
      {lines.map(([l, d]) => (
        <Big key={l} size={58} style={{ marginBottom: 22, color: hcr.cream, opacity: s(d), transform: `translateY(${interpolate(s(d), [0, 1], [16, 0])}px)` }}>{l}</Big>
      ))}
    </AbsoluteFill>
  );
};

// 6. CTA
const Cta: React.FC = () => {
  const s = useS();
  return (
    <AbsoluteFill style={{ background: hcr.navy, alignItems: "center", justifyContent: "center", padding: "0 80px" }}>
      <div style={{ opacity: s(0), transform: `scale(${interpolate(s(0), [0, 1], [0.9, 1])})` }}><Seal size={220} /></div>
      <Eyebrow style={{ marginTop: 50, opacity: s(10) }}>See the sample report</Eyebrow>
      <Big size={56} style={{ marginTop: 18, textAlign: "center", opacity: s(16) }}>home-clarity-hub.vercel.app/demo</Big>
      <div style={{ width: interpolate(s(24), [0, 1], [0, 180]), height: 4, background: hcr.gold, margin: "40px 0", borderRadius: 2 }} />
      <div style={{ fontFamily: hcrFonts.body, fontSize: 34, color: hcr.cream, textAlign: "center", opacity: s(30) }}>adam@hometownbuildersclub.com</div>
      <div style={{ position: "absolute", bottom: 120, fontFamily: hcrFonts.mono, fontSize: 22, letterSpacing: "0.2em", textTransform: "uppercase", color: hcr.muted, opacity: s(36), textAlign: "center" }}>Hometown Builders Club · Cuyahoga Falls, Ohio</div>
    </AbsoluteFill>
  );
};

export const DemoVertical: React.FC<VerticalProps> = ({ voiceover }) => (
  <AbsoluteFill style={{ background: hcr.navy }}>
    <Sequence from={f(T.hook[0])} durationInFrames={f(T.hook[1] - T.hook[0])}><Hook /></Sequence>
    <Sequence from={f(T.problem[0])} durationInFrames={f(T.problem[1] - T.problem[0])}><Problem /></Sequence>
    <Sequence from={f(T.expert[0])} durationInFrames={f(T.expert[1] - T.expert[0])}><Expert /></Sequence>
    <Sequence from={f(T.product[0])} durationInFrames={f(T.product[1] - T.product[0])}><Product /></Sequence>
    <Sequence from={f(T.offer[0])} durationInFrames={f(T.offer[1] - T.offer[0])}><Offer /></Sequence>
    <Sequence from={f(T.cta[0])} durationInFrames={f(T.cta[1] - T.cta[0])}><Cta /></Sequence>
    <Audio src={staticFile("audio/music.wav")} volume={voiceover ? 0.55 : 0.9} />
    {voiceover && VO.map((at, i) => (
      <Sequence key={i} from={f(at)} layout="none"><Audio src={staticFile(`audio/vo${i + 1}.wav`)} /></Sequence>
    ))}
  </AbsoluteFill>
);
