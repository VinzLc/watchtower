import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig(({ mode }) => {
  // Lit le .env racine pour rester synchronisé avec le backend.
  const env = loadEnv(mode, rootDir, "");
  const apiPort = env.PORT ?? "3001";

  return {
    plugins: [react()],
    server: {
      port: 5173,
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
