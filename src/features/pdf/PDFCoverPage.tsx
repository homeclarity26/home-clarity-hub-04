import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { colors } from "./pdfStyles";
import type { PDFBrandConfig } from "./pdfStyles";

interface PDFCoverPageProps {
  propertyName: string;
  address: string;
  date: string;
  coverImageUrl?: string;
  brand?: PDFBrandConfig;
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
  logo: {
    width: 120,
    height: 60,
    objectFit: "contain" as const,
    marginBottom: 24,
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
  tagline: {
    fontFamily: "IBM Plex Mono",
    fontSize: 8,
    color: colors.grey500,
    textTransform: "uppercase",
    letterSpacing: 2,
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

const PDFCoverPage = ({ propertyName, address, date, coverImageUrl, brand }: PDFCoverPageProps) => {
  const companyName = brand?.companyName || "Home Clarity Hub";
  const tagline = brand?.tagline || "Professional Home Stewardship";

  return (
    <Page size="LETTER" style={cs.page}>
      <View style={cs.imageSection}>
        {coverImageUrl ? (
          <Image src={coverImageUrl} style={cs.coverImage} />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.navy, justifyContent: "center", alignItems: "center" }}>
            {brand?.logoUrl ? (
              <Image src={brand.logoUrl} style={{ width: 160, height: 80, objectFit: "contain" as const }} />
            ) : (
              <Text style={{ fontFamily: "Playfair Display", fontSize: 48, color: colors.gold }}>HBC</Text>
            )}
          </View>
        )}
      </View>
      <View style={cs.contentSection}>
        {brand?.logoUrl && coverImageUrl && (
          <Image src={brand.logoUrl} style={cs.logo} />
        )}
        <Text style={cs.title}>Home Clarity Report</Text>
        <Text style={cs.address}>{propertyName || address}</Text>
        <View style={cs.goldBar} />
        <Text style={cs.preparedBy}>Prepared by {companyName}</Text>
        {tagline && <Text style={cs.tagline}>{tagline}</Text>}
        <Text style={cs.date}>{date}</Text>
      </View>
    </Page>
  );
};

export default PDFCoverPage;
