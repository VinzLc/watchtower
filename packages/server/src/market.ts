import { computeSignal, type Asset, type Signal } from "@watchtower/shared";
import { WATCHLIST } from "./config.js";
import { fetchCryptoCandles } from "./providers/crypto.js";
import { fetchStockCandles, stocksEnabled } from "./providers/stocks.js";

/** Récupère les bougies pour un actif selon son type. */
async function fetchCandles(asset: Asset) {
  if (asset.kind === "crypto") return fetchCryptoCandles(asset.symbol);
  return fetchStockCandles(asset.symbol);
}

/**
 * Calcule les signaux pour toute la watchlist en parallèle.
 * Les actifs en erreur (ex: actions sans clé API) sont simplement ignorés.
 */
export async function computeAllSignals(): Promise<Signal[]> {
  const targets = WATCHLIST.filter(
    (a) => a.kind === "crypto" || stocksEnabled(),
  );

  const results = await Promise.allSettled(
    targets.map(async (asset) => {
      const candles = await fetchCandles(asset);
      return computeSignal(asset, candles);
    }),
  );

  const signals: Signal[] = [];
  for (const [i, r] of results.entries()) {
    if (r.status === "fulfilled") {
      signals.push(r.value);
    } else {
      console.warn(`[market] ${targets[i]!.id} échec:`, r.reason?.message ?? r.reason);
    }
  }
  return signals;
}
