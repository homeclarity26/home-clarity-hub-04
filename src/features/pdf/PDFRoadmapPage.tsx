import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { colors, s } from "./pdfStyles";
import PDFFooter from "./PDFFooter";
import type { ReportPageData } from "@/data/reportContent";

interface PDFRoadmapPageProps {
  page: ReportPageData;
}

const rm = StyleSheet.create({
  timeline: {
    marginTop: 20,
  },
  yearGroup: {
    flexDirection: "row",
    marginBottom: 20,
  },
  yearColumn: {
    width: 80,
    alignItems: "center",
  },
  yearMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gold,
    marginBottom: 6,
  },
  yearLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.gold,
    opacity: 0.3,
  },
  yearLabel: {
    fontFamily: "IBM Plex Mono",
    fontSize: 11,
    fontWeight: 600,
    color: colors.navy,
    marginBottom: 4,
  },
  contentColumn: {
    flex: 1,
    paddingLeft: 12,
    paddingTop: 0,
  },
  phaseTitle: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: 600,
    color: colors.navy,
    marginBottom: 6,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.grey100,
    borderRadius: 2,
    marginBottom: 3,
  },
  itemText: {
    fontFamily: "Inter",
    fontSize: 9,
    color: colors.navy,
  },
  itemCost: {
    fontFamily: "IBM Plex Mono",
    fontSize: 9,
    color: colors.grey500,
  },
  paragraph: {
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 1.65,
    color: colors.navy,
    marginBottom: 14,
    maxWidth: 390,
  },
  pullQuote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    paddingLeft: 16,
    paddingVertical: 8,
    marginVertical: 20,
  },
  pullQuoteText: {
    fontFamily: "Cormorant Garamond",
    fontSize: 16,
    color: colors.navy,
    lineHeight: 1.5,
  },
});

const PDFRoadmapPage = ({ page }: PDFRoadmapPageProps) => (
  <Page size="LETTER" style={s.page} wrap>
    <Text style={s.h2}>{page.title}</Text>
    <View style={s.goldLineFull} />

    {/* Narrative */}
    {page.narrative.map((para, i) => {
      // Make the first paragraph a pull quote if it looks like a summary
      if (i === 0 && page.narrative.length > 1) {
        return (
          <View key={i} style={rm.pullQuote}>
            <Text style={rm.pullQuoteText}>{para}</Text>
          </View>
        );
      }
      return <Text key={i} style={rm.paragraph}>{para}</Text>;
    })}

    {/* If tiers exist, show as a summary table */}
    {page.tiers && (
      <View style={rm.timeline}>
        <Text style={{
          fontFamily: "IBM Plex Mono",
          fontSize: 8,
          color: colors.gold,
          textTransform: "uppercase",
          letterSpacing: 2,
          marginBottom: 16,
        }}>
          Investment Summary
        </Text>

        {/* Year 1 - Immediate */}
        <View style={rm.yearGroup}>
          <View style={rm.yearColumn}>
            <View style={rm.yearMarker} />
            <View style={rm.yearLine} />
          </View>
          <View style={rm.contentColumn}>
            <Text style={rm.yearLabel}>Year 1</Text>
            <Text style={rm.phaseTitle}>Immediate Priorities</Text>
            <View style={rm.item}>
              <Text style={rm.itemText}>Essential Tier</Text>
              <Text style={rm.itemCost}>{page.tiers.essential.price}</Text>
            </View>
            <Text style={{ fontFamily: "Inter", fontSize: 8, color: colors.grey500, marginTop: 2 }}>
              {page.tiers.essential.description}
            </Text>
          </View>
        </View>

        {/* Year 2-3 - Enhanced */}
        <View style={rm.yearGroup}>
          <View style={rm.yearColumn}>
            <View style={rm.yearMarker} />
            <View style={rm.yearLine} />
          </View>
          <View style={rm.contentColumn}>
            <Text style={rm.yearLabel}>Years 2–3</Text>
            <Text style={rm.phaseTitle}>Strategic Improvements</Text>
            <View style={rm.item}>
              <Text style={rm.itemText}>Enhanced Tier</Text>
              <Text style={rm.itemCost}>{page.tiers.enhanced.price}</Text>
            </View>
            <Text style={{ fontFamily: "Inter", fontSize: 8, color: colors.grey500, marginTop: 2 }}>
              {page.tiers.enhanced.description}
            </Text>
          </View>
        </View>

        {/* Year 3-5 - Signature */}
        <View style={rm.yearGroup}>
          <View style={rm.yearColumn}>
            <View style={rm.yearMarker} />
          </View>
          <View style={rm.contentColumn}>
            <Text style={rm.yearLabel}>Years 3–5</Text>
            <Text style={rm.phaseTitle}>Premium Transformation</Text>
            <View style={rm.item}>
              <Text style={rm.itemText}>Signature Tier</Text>
              <Text style={rm.itemCost}>{page.tiers.signature.price}</Text>
            </View>
            <Text style={{ fontFamily: "Inter", fontSize: 8, color: colors.grey500, marginTop: 2 }}>
              {page.tiers.signature.description}
            </Text>
          </View>
        </View>
      </View>
    )}

    {/* Recommendations */}
    {page.recommendations && page.recommendations.length > 0 && (
      <View wrap={false} style={{ marginTop: 24 }}>
        <Text style={{
          fontFamily: "IBM Plex Mono",
          fontSize: 8,
          color: colors.gold,
          textTransform: "uppercase",
          letterSpacing: 2,
          marginBottom: 10,
        }}>
          Key Actions
        </Text>
        {page.recommendations.map((rec, i) => (
          <View key={i} style={{ flexDirection: "row", marginBottom: 6, paddingLeft: 4 }}>
            <Text style={{ fontFamily: "Inter", fontSize: 11, color: colors.gold, width: 16 }}>—</Text>
            <Text style={{ fontFamily: "Inter", fontSize: 10, color: colors.navy, flex: 1, lineHeight: 1.5 }}>
              {rec}
            </Text>
          </View>
        ))}
      </View>
    )}

    {page.timing && (
      <View style={{
        backgroundColor: colors.cream,
        padding: 14,
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: colors.gold,
        marginTop: 20,
      }} wrap={false}>
        <Text style={{ fontFamily: "IBM Plex Mono", fontSize: 7, color: colors.grey500, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>
          Strategic Timing
        </Text>
        <Text style={{ fontFamily: "IBM Plex Mono", fontSize: 10, color: colors.navy }}>
          {page.timing}
        </Text>
      </View>
    )}

    <PDFFooter sectionName="Strategy" />
  </Page>
);

export default PDFRoadmapPage;
