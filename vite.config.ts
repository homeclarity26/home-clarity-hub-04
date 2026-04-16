import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Cap chunk warning so we see regressions, but don't fail builds on it.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Keep heavy vendor libs out of the main portal chunk.
        // Every portal visitor pays the cost of whatever is in the main chunk,
        // so we split admin-only / feature-specific libs.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
          pdf: ["@react-pdf/renderer"],
          map: ["leaflet", "react-leaflet"],
          charts: ["recharts"],
          tiptap: [
            "@tiptap/react",
            "@tiptap/starter-kit",
            "@tiptap/extension-image",
            "@tiptap/extension-placeholder",
          ],
          dnd: ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
          motion: ["framer-motion"],
        },
      },
    },
  },
}));
