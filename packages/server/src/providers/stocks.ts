import type { Candle } from "@watchtower/shared";

// Yahoo Finance : API publique (sans clé), fournit de vraies bougies OHLC.
const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

/** Le provider actions (Yahoo) ne nécessite pas de clé : toujours disponible. */
export function stocksEnabled(): boolean {
  return true;
}

interface YahooChartResponse {
  chart: {
    result?: Array<{
      timestamp?: number[];
      indicators: {
        quote?: Array<{
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }>;
      };
    }>;
    error?: { code: string; description: string } | null;
  };
}

/**
 * Récupère les bougies récentes depuis Yahoo Finance (aucune clé requise).
 * @param symbol ex: "AAPL"
 * @param interval ex: "1d", "1h"
 * @param range ex: "3mo", "1mo"
 */
export async function fetchStockCandles(
  symbol: string,
  interval = "1d",
  range = "3mo",
): Promise<Candle[]> {
  const url = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;

  const res = await fetch(url, {
    // Yahoo refuse les requêtes sans User-Agent (429/403).
    headers: { "User-Agent": "Mozilla/5.0 (Watchtower)" },
  });
  if (!res.ok) {
    throw new Error(`Yahoo ${symbol}: HTTP ${res.status}`);
  }

  const data = (await res.json()) as YahooChartResponse;
  if (data.chart.error) {
    throw new Error(`Yahoo ${symbol}: ${data.chart.error.description}`);
  }

  const result = data.chart.result?.[0];
  const quote = result?.indicators.quote?.[0];
  const times = result?.timestamp;
  if (!result || !quote || !times || !quote.close) {
    throw new Error(`Yahoo ${symbol}: pas de données`);
  }

  const candles: Candle[] = [];
  for (let i = 0; i < times.length; i++) {
    const close = quote.close[i];
    // Yahoo insère parfois des trous (null) ; on les ignore.
    if (close == null) continue;
    candles.push({
      time: times[i]! * 1000,
      open: quote.open?.[i] ?? close,
      high: quote.high?.[i] ?? close,
      low: quote.low?.[i] ?? close,
      close,
      volume: quote.volume?.[i] ?? 0,
    });
  }
  return candles;
}
