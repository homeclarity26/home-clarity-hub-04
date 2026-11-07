import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";

const { fontFamily: display } = loadCormorant("normal", { weights: ["500", "600"], subsets: ["latin"] });
const { fontFamily: body } = loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
const { fontFamily: mono } = loadPlexMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

export const hcrFonts = { display, body, mono };

// Locked HCR palette (HCR_STRUCTURE_LOCK.md)
export const hcr = {
  navy: "#0A1628",
  navySoft: "#1B2B4D",
  gold: "#B87333",
  goldLight: "#D4A574",
  cream: "#EDE9E1",
  creamLight: "#F5F2EC",
  white: "#FFFFFF",
  rust: "#B7410E",
  muted: "#C9C2B5",
};
