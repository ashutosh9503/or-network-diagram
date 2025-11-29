import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  base: "./",

  plugins: [
    react(),
    mode === "development" && componentTagger(),
VitePWA({
  registerType: "autoUpdate",
  includeAssets: ["favicon.ico"],
  manifest: {
    name: "OR Network Diagram Generator",
    short_name: "OR Diagram",
    start_url: ".",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "icons/icon-192.jpg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: "icons/icon-512.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any maskable",
      },
    ],
  },
}),


  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
