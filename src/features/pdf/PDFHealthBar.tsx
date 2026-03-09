import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { colors } from "./pdfStyles";

interface PDFHealthBarProps {
  label: string;
  current: number;
  total: number;
  unit: string;
}

const hb = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 20,
  },
  label: {
    fontFamily: "IBM Plex Mono",
    fontSize: 8,
    color: colors.grey500,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
  },
  trackContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  track: {
    flex: 1,
    height: 12,
    backgroundColor: colors.grey100,
    borderRadius: 6,
    overflow: "hidden",
  },
  fill: {
    height: 12,
    backgroundColor: colors.gold,
    borderRadius: 6,
  },
  valueText: {
    fontFamily: "IBM Plex Mono",
    fontSize: 10,
    color: colors.navy,
    width: 80,
    textAlign: "right",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  detailText: {
    fontFamily: "IBM Plex Mono",
    fontSize: 8,
    color: colors.grey500,
  },
});

const PDFHealthBar = ({ label, current, total, unit }: PDFHealthBarProps) => {
  const pct = Math.min((current / total) * 100, 100);
  const remaining = total - current;

  return (
    <View style={hb.container}>
      <Text style={hb.label}>{label}</Text>
      <View style={hb.trackContainer}>
        <View style={hb.track}>
          <View style={[hb.fill, { width: `${pct}%` }]} />
        </View>
        <Text style={hb.valueText}>
          {current} / {total} {unit}
        </Text>
      </View>
      <View style={hb.detailRow}>
        <Text style={hb.detailText}>{Math.round(pct)}% of expected lifespan used</Text>
        <Text style={hb.detailText}>~{remaining} {unit} remaining</Text>
      </View>
    </View>
  );
};

export default PDFHealthBar;
