import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { Asset } from "@watchtower/shared";

// Charge le .env à la racine du monorepo (src → server → packages → racine).
const rootEnv = resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env");
try {
  process.loadEnvFile(rootEnv);
} catch {
  // Pas de .env : on se rabat sur les variables d'environnement existantes.
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
};

/**
 * Liste des actifs suivis pour les signaux techniques (univers de James).
 * À terme : dérivée automatiquement des briefings.
 */
export const WATCHLIST: Asset[] = [
  { id: "stock:TSLA", kind: "stock", symbol: "TSLA", label: "Tesla" },
  { id: "stock:MU", kind: "stock", symbol: "MU", label: "Micron" },
  { id: "stock:PLTR", kind: "stock", symbol: "PLTR", label: "Palantir" },
  { id: "stock:STRC", kind: "stock", symbol: "STRC", label: "STRC" },
  { id: "stock:SPCX", kind: "stock", symbol: "SPCX", label: "SpaceX" },
  { id: "crypto:BTCUSDT", kind: "crypto", symbol: "BTCUSDT", label: "Bitcoin" },
  { id: "crypto:ETHUSDT", kind: "crypto", symbol: "ETHUSDT", label: "Ethereum" },
];
