import { useCurrentFrame, useVideoConfig, interpolate, AbsoluteFill } from "remotion";
import { colors } from "../theme";

export const PersistentBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Slow gradient shift across entire video
  const hue = interpolate(frame, [0, durationInFrames], [0, 15]);
  const gradientAngle = interpolate(frame, [0, durationInFrames], [135, 165]);

  return (
    <AbsoluteFill>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(${gradientAngle}deg, ${colors.navyDeep} 0%, ${colors.navy} 50%, hsl(${220 + hue}, 45%, 22%) 100%)`,
        }}
      />
      {/* Subtle noise texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage: `radial-gradient(circle at 20% 50%, ${colors.gold} 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${colors.goldLight} 0%, transparent 40%)`,
        }}
      />
    </AbsoluteFill>
  );
};
