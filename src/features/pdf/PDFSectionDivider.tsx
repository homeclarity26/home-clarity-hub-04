import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { colors } from "./pdfStyles";

interface PDFSectionDividerProps {
  sectionTitle: string;
  sectionNumber: number;
}

const ds = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    flexDirection: "row",
  },
  leftPanel: {
    width: "40%",
    backgroundColor: colors.navy,
    justifyContent: "flex-end",
    paddingBottom: 72,
    paddingLeft: 48,
    paddingRight: 24,
  },
  sectionNumber: {
    fontFamily: "IBM Plex Mono",
    fontSize: 72,
    color: colors.gold,
    opacity: 0.3,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Cormorant Garamond",
    fontSize: 32,
    color: colors.white,
    lineHeight: 1.3,
  },
  rightPanel: {
    width: "60%",
    justifyContent: "flex-end",
    paddingBottom: 72,
    paddingLeft: 48,
  },
  goldLine: {
    width: 48,
    height: 2,
    backgroundColor: colors.gold,
  },
});

const PDFSectionDivider = ({ sectionTitle, sectionNumber }: PDFSectionDividerProps) => (
  <Page size="LETTER" style={ds.page}>
    <View style={ds.leftPanel}>
      <Text style={ds.sectionNumber}>
        {String(sectionNumber).padStart(2, "0")}
      </Text>
      <Text style={ds.sectionTitle}>{sectionTitle}</Text>
    </View>
    <View style={ds.rightPanel}>
      <View style={ds.goldLine} />
    </View>
  </Page>
);

export default PDFSectionDivider;
