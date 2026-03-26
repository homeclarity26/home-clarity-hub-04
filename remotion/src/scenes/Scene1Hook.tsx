import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill, Img, staticFile } from "remotion";
import { fonts, colors } from "../theme";

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Hero image: slow ken burns zoom + pan
  const imgScale = interpolate(frame, [0, 180], [1.15, 1.25]);
  const imgX = interpolate(frame, [0, 180], [0, -30]);
  const imgOpacity = interpolate(frame, [0, 25], [0, 0.45], { extrapolateRight: "clamp" });

  // Text reveals - staggered
  const line1Spring = spring({ frame: frame - 20, fps, config: { damping: 25, stiffness: 120 } });
  const line1Y = interpolate(line1Spring, [0, 1], [60, 0]);
  const line1Op = interpolate(line1Spring, [0, 1], [0, 1]);

  const line2Spring = spring({ frame: frame - 35, fps, config: { damping: 25, stiffness: 120 } });
  const line2Y = interpolate(line2Spring, [0, 1], [60, 0]);
  const line2Op = interpolate(line2Spring, [0, 1], [0, 1]);

  // Gold accent line
  const lineWidth = spring({ frame: frame - 50, fps, config: { damping: 30, stiffness: 80 } });
  const lineW = interpolate(lineWidth, [0, 1], [0, 160]);

  // Subtitle
  const subSpring = spring({ frame: frame - 65, fps, config: { damping: 20 } });
  const subOp = interpolate(subSpring, [0, 1], [0, 1]);
  const subY = interpolate(subSpring, [0, 1], [30, 0]);

  // Exit fade
  const exitOp = interpolate(frame, [140, 165], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      {/* Background image with ken burns */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Img
          src={staticFile("images/hero-home.jpg")}
          style={{
            width: "110%",
            height: "110%",
            objectFit: "cover",
            opacity: imgOpacity,
            transform: `scale(${imgScale}) translateX(${imgX}px)`,
          }}
        />
        {/* Dark gradient overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${colors.navyDeep}ee 0%, ${colors.navy}aa 50%, ${colors.navyDeep}dd 100%)`,
        }} />
      </div>

      {/* Text content - left aligned, editorial */}
      <div style={{ position: "absolute", left: 140, top: 320, display: "flex", flexDirection: "column" }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{
            fontFamily: fonts.display,
            fontSize: 82,
            fontWeight: 700,
            color: colors.cream,
            transform: `translateY(${line1Y}px)`,
            opacity: line1Op,
            letterSpacing: "-1px",
            lineHeight: 1.1,
          }}>
            Your Home
          </div>
        </div>
        <div style={{ overflow: "hidden" }}>
          <div style={{
            fontFamily: fonts.display,
            fontSize: 82,
            fontWeight: 700,
            color: colors.gold,
            transform: `translateY(${line2Y}px)`,
            opacity: line2Op,
            letterSpacing: "-1px",
            lineHeight: 1.1,
          }}>
            Tells a Story
          </div>
        </div>

        {/* Gold accent line */}
        <div style={{
          width: lineW,
          height: 3,
          backgroundColor: colors.gold,
          marginTop: 32,
          borderRadius: 2,
        }} />

        {/* Subtitle */}
        <div style={{
          fontFamily: fonts.body,
          fontSize: 26,
          color: colors.softGray,
          opacity: subOp,
          transform: `translateY(${subY}px)`,
          marginTop: 28,
          fontWeight: 400,
          letterSpacing: "0.5px",
        }}>
          Are you listening?
        </div>
      </div>
    </AbsoluteFill>
  );
};
