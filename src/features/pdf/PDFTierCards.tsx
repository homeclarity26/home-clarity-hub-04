import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { colors } from "./pdfStyles";
import type { TierData } from "@/data/reportContent";

interface PDFTierCardsProps {
  tiers: {
    essential: TierData;
    enhanced: TierData;
    signature: TierData;
  };
}

const tc = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    borderWidth: 0.75,
    borderColor: colors.grey300,
    borderRadius: 4,
    padding: 14,
  },
  cardEnhanced: {
    borderTopWidth: 3,
    borderTopColor: colors.navy,
  },
  cardSignature: {
    borderTopWidth: 3,
    borderTopColor: colors.gold,
  },
  tierLabel: {
    fontFamily: "IBM Plex Mono",
    fontSize: 7,
    color: colors.grey500,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 6,
  },
  price: {
    fontFamily: "Cormorant Garamond",
    fontSize: 16,
    color: colors.navy,
    marginBottom: 8,
  },
  description: {
    fontFamily: "Inter",
    fontSize: 9,
    color: colors.grey700,
    lineHeight: 1.5,
  },
});

const PDFTierCards = ({ tiers }: PDFTierCardsProps) => (
  <View style={tc.container}>
    {/* Essential */}
    <View style={tc.card}>
      <Text style={tc.tierLabel}>Essential</Text>
      <Text style={tc.price}>{tiers.essential.price}</Text>
      <Text style={tc.description}>{tiers.essential.description}</Text>
    </View>

    {/* Enhanced */}
    <View style={[tc.card, tc.cardEnhanced]}>
      <Text style={tc.tierLabel}>Enhanced</Text>
      <Text style={tc.price}>{tiers.enhanced.price}</Text>
      <Text style={tc.description}>{tiers.enhanced.description}</Text>
    </View>

    {/* Signature */}
    <View style={[tc.card, tc.cardSignature]}>
      <Text style={tc.tierLabel}>Signature</Text>
      <Text style={tc.price}>{tiers.signature.price}</Text>
      <Text style={tc.description}>{tiers.signature.description}</Text>
    </View>
  </View>
);

export default PDFTierCards;
