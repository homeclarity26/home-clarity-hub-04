import { Font, StyleSheet } from "@react-pdf/renderer";

// Register fonts from Google Fonts CDN
Font.register({
  family: "Playfair Display",
  fonts: [
    { src: "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd1unDXbtM.ttf", fontWeight: 700 },
  ],
});

Font.register({
  family: "IBM Plex Mono",
  fonts: [
    { src: "https://fonts.gstatic.com/s/ibmplexmono/v19/-F63fjptAgt5VM-kVkqdyU8n5iQ.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/ibmplexmono/v19/-F6qfjptAgt5VM-kVkqdyU8n3oQI.ttf", fontWeight: 600 },
  ],
});

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiA.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFufAZ9hiA.ttf", fontWeight: 700 },
  ],
});

// Disable hyphenation for cleaner text
Font.registerHyphenationCallback((word) => [word]);

// Brand configuration
export interface PDFBrandConfig {
  companyName: string;
  tagline?: string;
  logoUrl?: string;
}

export const DEFAULT_BRAND: PDFBrandConfig = {
  companyName: "Home Clarity Hub",
  tagline: "Professional Home Stewardship",
};

// Design tokens
export const colors = {
  navy: "#1B2B4D",
  gold: "#C9A961",
  cream: "#F9F8F6",
  white: "#FFFFFF",
  grey100: "#F2F0ED",
  grey300: "#D4D0CA",
  grey500: "#8D8A84",
  grey700: "#5A5750",
};

// Shared styles
export const s = StyleSheet.create({
  page: {
    paddingTop: 72, // 1 inch
    paddingBottom: 72,
    paddingLeft: 90, // 1.25 inch binding edge
    paddingRight: 72,
    fontFamily: "Inter",
    fontSize: 11,
    color: colors.navy,
    backgroundColor: colors.white,
  },
  pageNoMargin: {
    fontFamily: "Inter",
    fontSize: 11,
    color: colors.navy,
    backgroundColor: colors.white,
  },

  // Typography
  h1: {
    fontFamily: "Playfair Display",
    fontSize: 36,
    fontWeight: 400,
    color: colors.navy,
    marginBottom: 12,
  },
  h2: {
    fontFamily: "Playfair Display",
    fontSize: 24,
    fontWeight: 400,
    color: colors.navy,
    marginBottom: 8,
  },
  h3: {
    fontFamily: "Playfair Display",
    fontSize: 18,
    fontWeight: 400,
    color: colors.navy,
    marginBottom: 6,
  },
  body: {
    fontFamily: "Inter",
    fontSize: 11,
    lineHeight: 1.65,
    color: colors.navy,
    maxWidth: 390, // ~65 chars at 11pt
  },
  label: {
    fontFamily: "IBM Plex Mono",
    fontSize: 8,
    fontWeight: 400,
    textTransform: "uppercase" as const,
    letterSpacing: 2,
    color: colors.grey500,
  },
  labelGold: {
    fontFamily: "IBM Plex Mono",
    fontSize: 9,
    fontWeight: 400,
    textTransform: "uppercase" as const,
    letterSpacing: 3,
    color: colors.gold,
  },
  mono: {
    fontFamily: "IBM Plex Mono",
    fontSize: 10,
  },
  monoSmall: {
    fontFamily: "IBM Plex Mono",
    fontSize: 8,
  },

  // Layout helpers
  goldLine: {
    width: 40,
    height: 1.5,
    backgroundColor: colors.gold,
    marginTop: 8,
    marginBottom: 24,
  },
  goldLineFull: {
    height: 0.75,
    backgroundColor: colors.gold,
    marginTop: 12,
    marginBottom: 20,
  },
  spacer: {
    height: 24,
  },
  spacerLg: {
    height: 48,
  },

  // Footer
  footer: {
    position: "absolute" as const,
    bottom: 36,
    left: 90,
    right: 72,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  footerText: {
    fontFamily: "IBM Plex Mono",
    fontSize: 8,
    color: colors.grey500,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
  },
});
