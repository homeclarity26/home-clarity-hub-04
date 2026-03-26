import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors } from "../theme";

interface GoldLineProps {
  delay?: number;
  width?: number;
  y?: number;
  direction?: "left" | "right";
}

export const GoldLine: React.FC<GoldLineProps> = ({ delay = 0, width = 120, y = 540, direction = "right" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame: frame - delay, fps, config: { damping: 30, stiffness: 80 } });
  const scaleX = interpolate(progress, [0, 1], [0, 1]);
  const opacity = interpolate(frame - delay, [0, 10], [0, 0.8], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: direction === "right" ? 0 : undefined,
        right: direction === "left" ? 0 : undefined,
        width,
        height: 2,
        backgroundColor: colors.gold,
        opacity,
        transform: `scaleX(${scaleX})`,
        transformOrigin: direction === "right" ? "left" : "right",
      }}
    />
  );
};
