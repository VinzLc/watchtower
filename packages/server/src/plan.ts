import {
  evaluateTarget,
  type Candle,
  type PriceTarget,
  type TargetEvaluation,
} from "@watchtower/shared";
import { fetchCryptoCandles } from "./providers/crypto.js";
import { fetchStockCandles } from "./providers/stocks.js";

/** Bougies journalières (~3 mois) selon le type d'actif, pour les graphiques. */
async function fetchDailyCandles(target: PriceTarget): Promise<Candle[]> {
  if (target.kind === "crypto") {
    return fetchCryptoCandles(target.symbol, "1d", 90);
  }
  return fetchStockCandles(target.symbol, "1d", "3mo");
}

/**
 * Évalue toutes les cibles de James par rapport au marché en direct.
 * Les cibles dont les données échouent sont ignorées (avec un log).
 */
export async function evaluateTargets(
  targets: PriceTarget[],
): Promise<TargetEvaluation[]> {
  const results = await Promise.allSettled(
    targets.map(async (target) => {
      const candles = await fetchDailyCandles(target);
      const livePrice = candles.length
        ? candles[candles.length - 1]!.close
        : 0;
      return evaluateTarget(target, livePrice, candles);
    }),
  );

  const evaluations: TargetEvaluation[] = [];
  for (const [i, r] of results.entries()) {
    if (r.status === "fulfilled") {
      evaluations.push(r.value);
    } else {
      console.warn(
        `[plan] cible ${targets[i]!.symbol} échec:`,
        r.reason?.message ?? r.reason,
      );
    }
  }
  return evaluations;
}
