import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages serves this app under /Ihkam-Quran-App/ in production.
  base: mode === "production" ? "/Ihkam-Quran-App/" : "/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icon-192.png", "icon-512.png"],
      manifest: false,
      workbox: {
        navigateFallback: "./index.html",
        globPatterns: ["**/*.{js,css,html,svg,png,ico,json,ttf,woff,woff2}"],
        globIgnores: [
          "**/quran.json",
          "**/quran_pages.json",
          "**/quran_chapters.json",
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
