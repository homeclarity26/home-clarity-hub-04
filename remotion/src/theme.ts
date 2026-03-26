import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";

const { fontFamily: playfair } = loadPlayfair("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const { fontFamily: dmSans } = loadDMSans("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });

export const fonts = { display: playfair, body: dmSans };

export const colors = {
  navy: "#1B2B4D",
  navyDeep: "#0F1A30",
  gold: "#C9A961",
  goldLight: "#D4BA7A",
  cream: "#F9F8F6",
  warmWhite: "#FFFFFF",
  softGray: "#E8E5E0",
  charcoal: "#3A3A3A",
};
