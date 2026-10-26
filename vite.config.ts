import path from "path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  experimental: {
    // porla serves the UI under --http-base-path; make the preload URLs that
    // Vite writes into JS relative so they follow wherever the chunk was loaded.
    renderBuiltUrl(_filename, { hostType }) {
      return hostType === "js" ? { relative: true } : undefined;
    },
  },
  server: {
    proxy: {
      "/api": process.env.PORLA_HOST ?? "http://localhost:1337",
    },
  },
});
