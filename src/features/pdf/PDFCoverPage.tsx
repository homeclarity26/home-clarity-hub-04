import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { colors } from "./pdfStyles";

interface PDFCoverPageProps {
  propertyName: string;
  address: string;
  date: string;
  coverImageUrl?: string;
}

const cs = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
  },
  imageSection: {
    height: "50%",
    backgroundColor: colors.grey100,
  },
  coverImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  contentSection: {
    height: "50%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 72,
  },
  title: {
    fontFamily: "Playfair Display",
    fontSize: 36,
    color: colors.navy,
    textAlign: "center",
    marginBottom: 12,
  },
  address: {
    fontFamily: "Inter",
    fontSize: 14,
    color: colors.grey500,
    textAlign: "center",
    marginBottom: 40,
  },
  preparedBy: {
    fontFamily: "IBM Plex Mono",
    fontSize: 9,
    color: colors.gold,
    textTransform: "uppercase",
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 8,
  },
  date: {
    fontFamily: "IBM Plex Mono",
    fontSize: 9,
    color: colors.grey500,
    textAlign: "center",
  },
  goldBar: {
    width: 48,
    height: 2,
    backgroundColor: colors.gold,
    marginBottom: 32,
  },
});

const PDFCoverPage = ({ propertyName, address, date, coverImageUrl }: PDFCoverPageProps) => (
  <Page size="LETTER" style={cs.page}>
    <View style={cs.imageSection}>
      {coverImageUrl ? (
        <Image src={coverImageUrl} style={cs.coverImage} />
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.navy, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontFamily: "Playfair Display", fontSize: 48, color: colors.gold }}>HBC</Text>
        </View>
      )}
    </View>
    <View style={cs.contentSection}>
      <Text style={cs.title}>Home Clarity Report</Text>
      <Text style={cs.address}>{propertyName || address}</Text>
      <View style={cs.goldBar} />
      <Text style={cs.preparedBy}>Prepared by Hometown Builders Club</Text>
      <Text style={cs.date}>{date}</Text>
    </View>
  </Page>
);

export default PDFCoverPage;
