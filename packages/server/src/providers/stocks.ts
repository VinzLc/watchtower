import type { Candle } from "@watchtower/shared";
import { config } from "../config.js";

const FINNHUB_BASE = "https://finnhub.io/api/v1";

/** Indique si le provider actions est utilisable (clé présente). */
export function stocksEnabled(): boolean {
  return config.finnhubApiKey.length > 0;
}

interface FinnhubCandleResponse {
  s: string; // "ok" | "no_data"
  t?: number[]; // timestamps (s)
  o?: number[];
  h?: number[];
  l?: number[];
  c?: number[];
  v?: number[];
}

/**
 * Récupère les bougies récentes depuis Finnhub (clé requise).
 * @param symbol ex: "AAPL"
 * @param resolution ex: "60" (minutes), "D" (jour)
 * @param count nombre de bougies
 */
export async function fetchStockCandles(
  symbol: string,
  resolution = "60",
  count = 100,
): Promise<Candle[]> {
  if (!stocksEnabled()) {
    throw new Error("FINNHUB_API_KEY manquante : provider actions désactivé");
  }

  const now = Math.floor(Date.now() / 1000);
  // Fenêtre large pour garantir assez de bougies (les marchés ferment).
  const from = now - count * 3600 * 6;

  const url =
    `${FINNHUB_BASE}/stock/candle?symbol=${encodeURIComponent(symbol)}` +
    `&resolution=${resolution}&from=${from}&to=${now}&token=${config.finnhubApiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Finnhub ${symbol}: HTTP ${res.status}`);
  }

  const data = (await res.json()) as FinnhubCandleResponse;
  if (data.s !== "ok" || !data.t || !data.c) {
    throw new Error(`Finnhub ${symbol}: pas de données (${data.s})`);
  }

  const candles: Candle[] = [];
  for (let i = 0; i < data.t.length; i++) {
    candles.push({
      time: data.t[i]! * 1000,
      open: data.o?.[i] ?? 0,
      high: data.h?.[i] ?? 0,
      low: data.l?.[i] ?? 0,
      close: data.c[i]!,
      volume: data.v?.[i] ?? 0,
    });
  }
  return candles;
}
