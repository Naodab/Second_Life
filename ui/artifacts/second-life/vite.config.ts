import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const envDir = import.meta.dirname;

const replitPlugins =
  process.env.NODE_ENV !== "production" &&
  process.env.REPL_ID !== undefined
    ? await Promise.all([
        import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer({
            root: path.resolve(import.meta.dirname, ".."),
          }),
        ),
        import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
      ])
    : [];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, "");

  const rawPort = env.PORT ?? process.env.PORT;
  if (!rawPort) {
    throw new Error(
      "PORT environment variable is required but was not provided. Copy .env.example to .env or set PORT.",
    );
  }

  const port = Number(rawPort);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  const basePath = env.BASE_PATH ?? process.env.BASE_PATH;
  if (!basePath) {
    throw new Error(
      "BASE_PATH environment variable is required but was not provided. Copy .env.example to .env or set BASE_PATH.",
    );
  }

  return {
    base: basePath,
    envDir,
    plugins: [
      react(),
      tailwindcss(),
      runtimeErrorOverlay(),
      ...replitPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(
          import.meta.dirname,
          "..",
          "..",
          "attached_assets",
        ),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
      watch:
        process.env.VITE_WATCH_POLLING === "1"
          ? { usePolling: true, interval: 300 }
          : undefined,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
