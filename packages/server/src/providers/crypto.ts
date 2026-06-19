import type { Candle } from "@watchtower/shared";

const BINANCE_BASE = "https://api.binance.com";

/**
 * Récupère les bougies récentes depuis l'API publique Binance (aucune clé requise).
 * @param symbol ex: "BTCUSDT"
 * @param interval ex: "1h", "4h", "1d"
 * @param limit nombre de bougies
 */
export async function fetchCryptoCandles(
  symbol: string,
  interval = "1h",
  limit = 100,
): Promise<Candle[]> {
  const url = `${BINANCE_BASE}/api/v3/klines?symbol=${encodeURIComponent(
    symbol,
  )}&interval=${interval}&limit=${limit}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Binance ${symbol}: HTTP ${res.status}`);
  }

  // Format Binance: [ openTime, open, high, low, close, volume, ... ]
  const raw = (await res.json()) as unknown[][];
  return raw.map((k) => ({
    time: Number(k[0]),
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
  }));
}
