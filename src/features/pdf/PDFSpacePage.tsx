import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { colors, s } from "./pdfStyles";
import PDFFooter from "./PDFFooter";
import PDFHealthBar from "./PDFHealthBar";
import PDFTierCards from "./PDFTierCards";
import type { ReportPageData } from "@/data/reportContent";

interface PDFSpacePageProps {
  page: ReportPageData;
  groupName: string;
  images?: string[];
}

const sp = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  conditionBadge: {
    fontFamily: "IBM Plex Mono",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    backgroundColor: colors.grey100,
  },
  sectionLabel: {
    fontFamily: "IBM Plex Mono",
    fontSize: 8,
    color: colors.gold,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 28,
    marginBottom: 8,
  },
  paragraph: {
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 1.65,
    color: colors.navy,
    marginBottom: 14,
    maxWidth: 390,
  },
  timingBox: {
    backgroundColor: colors.cream,
    padding: 14,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    marginTop: 16,
  },
  timingLabel: {
    fontFamily: "IBM Plex Mono",
    fontSize: 7,
    color: colors.grey500,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  timingText: {
    fontFamily: "IBM Plex Mono",
    fontSize: 10,
    color: colors.navy,
  },
  recItem: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 4,
  },
  recBullet: {
    fontFamily: "Inter",
    fontSize: 11,
    color: colors.gold,
    width: 16,
  },
  recText: {
    fontFamily: "Inter",
    fontSize: 10,
    color: colors.navy,
    flex: 1,
    lineHeight: 1.5,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  photo: {
    width: 210,
    height: 158,
    objectFit: "cover",
    borderRadius: 2,
  },
});

const conditionColor = (rating?: string) => {
  switch (rating) {
    case "Excellent": return colors.gold;
    case "Good": return colors.navy;
    case "Fair": return colors.grey500;
    case "Poor": return "#F97316";
    case "Critical": return "#DC2626";
    default: return colors.grey500;
  }
};

const PDFSpacePage = ({ page, groupName, images = [] }: PDFSpacePageProps) => (
  <Page size="LETTER" style={s.page} wrap>
    {/* Title row */}
    <View style={sp.titleRow}>
      <Text style={s.h2}>{page.title}</Text>
      {page.conditionRating && (
        <Text style={[sp.conditionBadge, { color: conditionColor(page.conditionRating) }]}>
          {page.conditionRating}
        </Text>
      )}
    </View>
    <View style={s.goldLineFull} />

    {/* Narrative */}
    {page.narrative.map((para, i) => (
      <Text key={i} style={sp.paragraph}>{para}</Text>
    ))}

    {/* Health Bar */}
    {page.healthBar && (
      <PDFHealthBar {...page.healthBar} />
    )}

    {/* Specs Table */}
    {page.specs && page.specs.length > 0 && (
      <View wrap={false}>
        <Text style={sp.sectionLabel}>System Specifications</Text>
        {page.specs.map((spec, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              paddingVertical: 6,
              paddingHorizontal: 10,
              backgroundColor: i % 2 === 0 ? colors.grey100 : colors.white,
            }}
          >
            <Text style={{ fontFamily: "IBM Plex Mono", fontSize: 9, color: colors.grey500, width: 160 }}>
              {spec.label}
            </Text>
            <Text style={{ fontFamily: "Inter", fontSize: 10, color: colors.navy, flex: 1 }}>
              {spec.value}
            </Text>
          </View>
        ))}
      </View>
    )}

    {/* Investment Options */}
    {page.tiers && (
      <View wrap={false}>
        <Text style={sp.sectionLabel}>Investment Options</Text>
        <PDFTierCards tiers={page.tiers} />
      </View>
    )}

    {/* Strategic Timing */}
    {page.timing && (
      <View style={sp.timingBox} wrap={false}>
        <Text style={sp.timingLabel}>Strategic Timing</Text>
        <Text style={sp.timingText}>{page.timing}</Text>
      </View>
    )}

    {/* Recommendations */}
    {page.recommendations && page.recommendations.length > 0 && (
      <View wrap={false}>
        <Text style={sp.sectionLabel}>Recommendations</Text>
        {page.recommendations.map((rec, i) => (
          <View key={i} style={sp.recItem}>
            <Text style={sp.recBullet}>—</Text>
            <Text style={sp.recText}>{rec}</Text>
          </View>
        ))}
      </View>
    )}

    {/* Photos */}
    {images.length > 0 && (
      <View style={sp.photoGrid} wrap>
        {images.map((url, i) => (
          <Image key={i} src={url} style={sp.photo} />
        ))}
      </View>
    )}

    <PDFFooter sectionName={groupName} />
  </Page>
);

export default PDFSpacePage;
