import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill, Img, staticFile } from "remotion";
import { fonts, colors } from "../theme";

export const Scene5Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Advisor image subtle reveal
  const imgOp = interpolate(frame, [0, 30], [0, 0.25], { extrapolateRight: "clamp" });
  const imgScale = interpolate(frame, [0, 150], [1.05, 1.12]);

  // Brand mark
  const brandSpring = spring({ frame: frame - 15, fps, config: { damping: 25, stiffness: 100 } });
  const brandOp = interpolate(brandSpring, [0, 1], [0, 1]);
  const brandScale = interpolate(brandSpring, [0, 1], [0.9, 1]);

  // Gold line
  const lineSpring = spring({ frame: frame - 35, fps, config: { damping: 30 } });
  const lineW = interpolate(lineSpring, [0, 1], [0, 200]);

  // Tagline
  const tagSpring = spring({ frame: frame - 45, fps, config: { damping: 20 } });
  const tagOp = interpolate(tagSpring, [0, 1], [0, 1]);
  const tagY = interpolate(tagSpring, [0, 1], [25, 0]);

  // URL
  const urlSpring = spring({ frame: frame - 65, fps, config: { damping: 20 } });
  const urlOp = interpolate(urlSpring, [0, 1], [0, 0.7]);

  return (
    <AbsoluteFill>
      {/* Background image */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <Img
          src={staticFile("images/advisor-inspect.jpg")}
          style={{
            width: "110%",
            height: "110%",
            objectFit: "cover",
            opacity: imgOp,
            transform: `scale(${imgScale})`,
            filter: "blur(2px)",
          }}
        />
        <div style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, ${colors.navyDeep}dd 0%, ${colors.navyDeep}ff 70%)`,
        }} />
      </div>

      {/* Centered brand content */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* Brand name */}
        <div style={{
          fontFamily: fonts.display,
          fontSize: 78,
          fontWeight: 700,
          color: colors.cream,
          opacity: brandOp,
          transform: `scale(${brandScale})`,
          letterSpacing: "-1px",
        }}>
          Home Clarity Hub
        </div>

        {/* Gold line */}
        <div style={{
          width: lineW,
          height: 3,
          backgroundColor: colors.gold,
          marginTop: 36,
          marginBottom: 36,
          borderRadius: 2,
        }} />

        {/* Tagline */}
        <div style={{
          fontFamily: fonts.display,
          fontSize: 32,
          fontWeight: 400,
          fontStyle: "italic",
          color: colors.goldLight,
          opacity: tagOp,
          transform: `translateY(${tagY}px)`,
          marginBottom: 40,
        }}>
          Quiet stewardship for the home you love
        </div>

        {/* URL / CTA text */}
        <div style={{
          fontFamily: fonts.body,
          fontSize: 20,
          fontWeight: 500,
          color: colors.softGray,
          opacity: urlOp,
          letterSpacing: "3px",
          textTransform: "uppercase",
        }}>
          homeclarityhub.com
        </div>
      </div>

      {/* Corner accents */}
      <div style={{
        position: "absolute",
        top: 60,
        left: 60,
        width: 40,
        height: 40,
        borderTop: `2px solid ${colors.gold}44`,
        borderLeft: `2px solid ${colors.gold}44`,
        opacity: brandOp,
      }} />
      <div style={{
        position: "absolute",
        bottom: 60,
        right: 60,
        width: 40,
        height: 40,
        borderBottom: `2px solid ${colors.gold}44`,
        borderRight: `2px solid ${colors.gold}44`,
        opacity: brandOp,
      }} />
    </AbsoluteFill>
  );
};
