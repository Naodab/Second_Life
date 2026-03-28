import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import type { ConfigEnv, UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const envDir = path.resolve(configDir);

// loadEnv: .env is not applied to process.env before this file runs; envDir = package root.
function normalizeViteBase(raw: string | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }
  let b = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (!b.endsWith("/")) {
    b = `${b}/`;
  }
  return b;
}

export default defineConfig(async ({ mode }: ConfigEnv): Promise<UserConfig> => {
  const fileEnv = loadEnv(mode, envDir, "");
  const rawPort = process.env.PORT ?? fileEnv.PORT ?? "5173";
  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  const basePath = normalizeViteBase(
    process.env.BASE_PATH ?? fileEnv.BASE_PATH,
  );

  const replitPlugins =
    process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          (await import("@replit/vite-plugin-cartographer")).cartographer({
            root: path.resolve(configDir, ".."),
          }),
          (await import("@replit/vite-plugin-dev-banner")).devBanner(),
        ]
      : [];

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
        "@": path.resolve(configDir, "src"),
        "@assets": path.resolve(configDir, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(configDir),
    build: {
      outDir: path.resolve(configDir, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
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
