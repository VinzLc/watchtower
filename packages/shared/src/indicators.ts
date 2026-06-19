/**
 * Indicateurs techniques purs (sans dépendances).
 * Toutes les fonctions retournent `undefined` quand les données sont insuffisantes.
 */

/** Moyenne mobile simple sur les `period` dernières valeurs. */
export function sma(values: number[], period: number): number | undefined {
  if (period <= 0 || values.length < period) return undefined;
  let sum = 0;
  for (let i = values.length - period; i < values.length; i++) {
    sum += values[i]!;
  }
  return sum / period;
}

/** Moyenne mobile exponentielle (dernière valeur de la série EMA). */
export function ema(values: number[], period: number): number | undefined {
  if (period <= 0 || values.length < period) return undefined;
  const k = 2 / (period + 1);
  // Amorce avec la SMA des `period` premières valeurs.
  let prev = 0;
  for (let i = 0; i < period; i++) prev += values[i]!;
  prev /= period;
  for (let i = period; i < values.length; i++) {
    prev = values[i]! * k + prev * (1 - k);
  }
  return prev;
}

/**
 * RSI (Relative Strength Index) de Wilder sur `period` (défaut 14).
 * Retourne une valeur 0..100.
 */
export function rsi(values: number[], period = 14): number | undefined {
  if (values.length < period + 1) return undefined;

  let gain = 0;
  let loss = 0;
  // Première moyenne (simple) sur les `period` premières variations.
  for (let i = 1; i <= period; i++) {
    const diff = values[i]! - values[i - 1]!;
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;

  // Lissage de Wilder sur le reste.
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i]! - values[i - 1]!;
    const up = diff > 0 ? diff : 0;
    const down = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + up) / period;
    avgLoss = (avgLoss * (period - 1) + down) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** Variation en pourcentage entre la première et la dernière valeur. */
export function changePct(values: number[]): number {
  if (values.length < 2) return 0;
  const first = values[0]!;
  const last = values[values.length - 1]!;
  if (first === 0) return 0;
  return ((last - first) / first) * 100;
}
