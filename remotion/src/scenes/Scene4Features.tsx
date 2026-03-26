import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from "remotion";
import { fonts, colors } from "../theme";

const features = [
  { icon: "🔍", title: "Full Assessment", desc: "Every system inspected and rated" },
  { icon: "📋", title: "Action Roadmap", desc: "Prioritized repairs & upgrades" },
  { icon: "⚙️", title: "Equipment Registry", desc: "Digital twin of your home's systems" },
  { icon: "📅", title: "Maintenance Schedule", desc: "Never miss a service date" },
  { icon: "💰", title: "Financial Plan", desc: "Budget-aligned improvement tiers" },
  { icon: "📁", title: "Document Vault", desc: "Warranties, manuals, records" },
];

export const Scene4Features: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleSpring = spring({ frame: frame - 5, fps, config: { damping: 22 } });

  // Exit
  const exitOp = interpolate(frame, [165, 185], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOp }}>
      {/* Section label */}
      <div style={{
        position: "absolute",
        top: 120,
        left: 0,
        right: 0,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: fonts.body,
          fontSize: 14,
          fontWeight: 600,
          color: colors.gold,
          letterSpacing: "4px",
          textTransform: "uppercase",
          marginBottom: 18,
          opacity: interpolate(titleSpring, [0, 1], [0, 1]),
        }}>
          WHAT&apos;S INCLUDED
        </div>
        <div style={{
          fontFamily: fonts.display,
          fontSize: 52,
          fontWeight: 700,
          color: colors.cream,
          opacity: interpolate(titleSpring, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleSpring, [0, 1], [30, 0])}px)`,
        }}>
          Everything Your Home Needs
        </div>
      </div>

      {/* Feature cards grid - 3x2 */}
      <div style={{
        position: "absolute",
        top: 310,
        left: 160,
        right: 160,
        display: "flex",
        flexWrap: "wrap",
        gap: 28,
        justifyContent: "center",
      }}>
        {features.map((f, i) => {
          const delay = 20 + i * 12;
          const s = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 120 } });
          const cardOp = interpolate(s, [0, 1], [0, 1]);
          const cardScale = interpolate(s, [0, 1], [0.9, 1]);
          const cardY = interpolate(s, [0, 1], [30, 0]);

          // Subtle hover-like float
          const float = Math.sin((frame + i * 20) * 0.04) * 3;

          return (
            <div
              key={i}
              style={{
                width: 480,
                padding: "36px 32px",
                borderRadius: 16,
                background: `linear-gradient(145deg, ${colors.navy}cc, ${colors.navyDeep}ee)`,
                border: `1px solid ${colors.gold}22`,
                opacity: cardOp,
                transform: `scale(${cardScale}) translateY(${cardY + float}px)`,
                display: "flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              <div style={{ fontSize: 40, lineHeight: 1 }}>{f.icon}</div>
              <div>
                <div style={{
                  fontFamily: fonts.display,
                  fontSize: 22,
                  fontWeight: 600,
                  color: colors.cream,
                  marginBottom: 6,
                }}>
                  {f.title}
                </div>
                <div style={{
                  fontFamily: fonts.body,
                  fontSize: 16,
                  color: colors.softGray,
                }}>
                  {f.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
