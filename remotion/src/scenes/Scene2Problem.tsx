import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from "remotion";
import { fonts, colors } from "../theme";

const stats = [
  { value: "77%", label: "of homeowners miss critical\nmaintenance deadlines" },
  { value: "$12K", label: "average cost of a preventable\nhome repair" },
  { value: "3 in 5", label: "homes have hidden issues\nthe owner doesn't know about" },
];

export const Scene2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title entrance
  const titleSpring = spring({ frame: frame - 5, fps, config: { damping: 22 } });
  const titleOp = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);

  // Exit
  const exitOp = interpolate(frame, [140, 160], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      {/* Section label */}
      <div style={{
        position: "absolute",
        top: 180,
        left: 140,
        fontFamily: fonts.body,
        fontSize: 14,
        fontWeight: 600,
        color: colors.gold,
        letterSpacing: "4px",
        textTransform: "uppercase",
        opacity: titleOp,
        transform: `translateY(${titleY}px)`,
      }}>
        THE BLIND SPOT
      </div>

      {/* Stats grid */}
      <div style={{
        position: "absolute",
        top: 280,
        left: 140,
        right: 140,
        display: "flex",
        gap: 80,
      }}>
        {stats.map((stat, i) => {
          const delay = 20 + i * 18;
          const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 100 } });
          const op = interpolate(s, [0, 1], [0, 1]);
          const y = interpolate(s, [0, 1], [50, 0]);

          // Counter animation for numbers
          const counterProgress = interpolate(frame - delay, [0, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div key={i} style={{ flex: 1, opacity: op, transform: `translateY(${y}px)` }}>
              <div style={{
                fontFamily: fonts.display,
                fontSize: 96,
                fontWeight: 700,
                color: colors.cream,
                lineHeight: 1,
                marginBottom: 20,
              }}>
                {stat.value}
              </div>
              {/* Gold line under stat */}
              <div style={{
                width: interpolate(counterProgress, [0, 1], [0, 60]),
                height: 2,
                backgroundColor: colors.gold,
                marginBottom: 18,
              }} />
              <div style={{
                fontFamily: fonts.body,
                fontSize: 20,
                color: colors.softGray,
                lineHeight: 1.5,
                whiteSpace: "pre-line",
              }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom line */}
      <div style={{
        position: "absolute",
        bottom: 160,
        left: 140,
        right: 140,
      }}>
        {(() => {
          const bSpring = spring({ frame: frame - 80, fps, config: { damping: 20 } });
          return (
            <div style={{
              fontFamily: fonts.display,
              fontSize: 36,
              fontWeight: 600,
              fontStyle: "italic",
              color: colors.goldLight,
              opacity: interpolate(bSpring, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(bSpring, [0, 1], [30, 0])}px)`,
            }}>
              What if someone was watching out for it all?
            </div>
          );
        })()}
      </div>
    </AbsoluteFill>
  );
};
