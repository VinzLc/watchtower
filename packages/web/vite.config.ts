import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig(({ mode }) => {
  // Lit le .env racine pour rester synchronisé avec le backend.
  const env = loadEnv(mode, rootDir, "");
  const apiPort = env.PORT ?? "3001";
  const webPort = Number(env.WEB_PORT ?? "5180");

  return {
    // Sous-chemin du projet sur GitHub Pages (https://<user>.github.io/watchtower/).
    base: mode === "production" ? env.BASE_PATH ?? "/watchtower/" : "/",
    plugins: [react()],
    server: {
      port: webPort,
      strictPort: true,
      proxy: {
        // Le dashboard appelle /api/* → proxifié vers le backend Fastify.
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
