import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const port = Number(process.env.PORT || 5173);
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          const normalized = id.replaceAll("\\", "/");
          if (
            normalized.includes("node_modules/@react-three/") ||
            normalized.includes("node_modules/three/") ||
            normalized.includes("node_modules/three-stdlib/") ||
            normalized.includes("node_modules/maath/") ||
            normalized.includes("node_modules/zustand/") ||
            normalized.includes("node_modules/suspend-react/") ||
            normalized.includes("node_modules/react-composer/") ||
            normalized.includes("node_modules/react-use-measure/") ||
            normalized.includes("node_modules/use-sync-external-store/") ||
            normalized.includes("node_modules/its-fine/") ||
            normalized.includes("node_modules/meshline/") ||
            normalized.includes("node_modules/camera-controls/") ||
            normalized.includes("node_modules/troika-") ||
            normalized.includes("node_modules/stats-gl/") ||
            normalized.includes("node_modules/fflate/")
          ) {
            return "three-runtime";
          }
          if (normalized.includes("node_modules/lucide-react/")) return "ui-icons";
          if (
            normalized.includes("node_modules/react/") ||
            normalized.includes("node_modules/react-dom/") ||
            normalized.includes("node_modules/scheduler/")
          ) {
            return "react-runtime";
          }
          return "vendor";
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
