import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { colors } from "./pdfStyles";

interface PDFTitlePageProps {
  creatorName: string;
  creatorEmail?: string;
  creatorPhone?: string;
}

const ts = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    padding: 72,
  },
  logo: {
    fontFamily: "Playfair Display",
    fontSize: 28,
    color: colors.navy,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: "IBM Plex Mono",
    fontSize: 8,
    color: colors.gold,
    textTransform: "uppercase",
    letterSpacing: 3,
    marginBottom: 48,
  },
  goldBar: {
    width: 32,
    height: 1.5,
    backgroundColor: colors.gold,
    marginBottom: 48,
  },
  contactLabel: {
    fontFamily: "IBM Plex Mono",
    fontSize: 7,
    color: colors.grey500,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
  },
  contactName: {
    fontFamily: "Inter",
    fontSize: 12,
    color: colors.navy,
    marginBottom: 4,
  },
  contactDetail: {
    fontFamily: "Inter",
    fontSize: 10,
    color: colors.grey500,
    marginBottom: 2,
  },
});

const PDFTitlePage = ({ creatorName, creatorEmail, creatorPhone }: PDFTitlePageProps) => (
  <Page size="LETTER" style={ts.page}>
    <Text style={ts.logo}>Hometown Builders Club</Text>
    <Text style={ts.tagline}>Stewarding Your Home's Future</Text>
    <View style={ts.goldBar} />
    <Text style={ts.contactLabel}>Your Report Prepared By</Text>
    <Text style={ts.contactName}>{creatorName}</Text>
    {creatorEmail && <Text style={ts.contactDetail}>{creatorEmail}</Text>}
    {creatorPhone && <Text style={ts.contactDetail}>{creatorPhone}</Text>}
  </Page>
);

export default PDFTitlePage;
