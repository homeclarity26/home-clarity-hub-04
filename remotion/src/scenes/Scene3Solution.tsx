import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill, Img, staticFile } from "remotion";
import { fonts, colors } from "../theme";

export const Scene3Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo / brand reveal
  const brandSpring = spring({ frame: frame - 5, fps, config: { damping: 25, stiffness: 150 } });
  const brandScale = interpolate(brandSpring, [0, 1], [0.85, 1]);
  const brandOp = interpolate(brandSpring, [0, 1], [0, 1]);

  // Tagline
  const tagSpring = spring({ frame: frame - 25, fps, config: { damping: 20 } });
  const tagOp = interpolate(tagSpring, [0, 1], [0, 1]);
  const tagY = interpolate(tagSpring, [0, 1], [30, 0]);

  // Portal mockup slides in from right
  const mockupSpring = spring({ frame: frame - 40, fps, config: { damping: 22, stiffness: 80 } });
  const mockupX = interpolate(mockupSpring, [0, 1], [300, 0]);
  const mockupOp = interpolate(mockupSpring, [0, 1], [0, 1]);
  const mockupScale = interpolate(frame, [40, 170], [1, 1.03]);

  // Description text
  const descSpring = spring({ frame: frame - 55, fps, config: { damping: 20 } });
  const descOp = interpolate(descSpring, [0, 1], [0, 1]);

  // Exit
  const exitOp = interpolate(frame, [145, 170], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      {/* Left side - text content */}
      <div style={{ position: "absolute", left: 140, top: 200, width: 700, display: "flex", flexDirection: "column" }}>
        {/* Section label */}
        <div style={{
          fontFamily: fonts.body,
          fontSize: 14,
          fontWeight: 600,
          color: colors.gold,
          letterSpacing: "4px",
          textTransform: "uppercase",
          marginBottom: 30,
          opacity: brandOp,
        }}>
          INTRODUCING
        </div>

        <div style={{
          fontFamily: fonts.display,
          fontSize: 68,
          fontWeight: 700,
          color: colors.cream,
          lineHeight: 1.1,
          opacity: brandOp,
          transform: `scale(${brandScale})`,
          transformOrigin: "left center",
        }}>
          Home Clarity Hub
        </div>

        {/* Gold separator */}
        <div style={{
          width: interpolate(tagSpring, [0, 1], [0, 100]),
          height: 3,
          backgroundColor: colors.gold,
          marginTop: 32,
          marginBottom: 28,
        }} />

        <div style={{
          fontFamily: fonts.display,
          fontSize: 30,
          fontWeight: 400,
          fontStyle: "italic",
          color: colors.goldLight,
          opacity: tagOp,
          transform: `translateY(${tagY}px)`,
          marginBottom: 24,
        }}>
          Your digital stewardship portal
        </div>

        <div style={{
          fontFamily: fonts.body,
          fontSize: 20,
          color: colors.softGray,
          lineHeight: 1.7,
          opacity: descOp,
          maxWidth: 520,
        }}>
          A dedicated advisor assesses every system in your home, 
          then delivers a living digital report you can access anytime.
        </div>
      </div>

      {/* Right side - portal mockup */}
      <div style={{
        position: "absolute",
        right: 60,
        top: 140,
        opacity: mockupOp,
        transform: `translateX(${mockupX}px) scale(${mockupScale})`,
      }}>
        <div style={{
          width: 680,
          height: 480,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: `0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px ${colors.gold}22`,
        }}>
          <Img
            src={staticFile("images/portal-tablet.jpg")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        {/* Reflection glow */}
        <div style={{
          position: "absolute",
          bottom: -40,
          left: 40,
          right: 40,
          height: 60,
          background: `radial-gradient(ellipse, ${colors.gold}15 0%, transparent 70%)`,
        }} />
      </div>
    </AbsoluteFill>
  );
};
