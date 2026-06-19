import type { Asset, Candle, Signal, SignalAction } from "./types.js";
import { changePct, rsi, sma } from "./indicators.js";

/** Paramètres de la stratégie. Ajuste-les ici pour calibrer les signaux. */
export interface SignalConfig {
  smaShortPeriod: number;
  smaLongPeriod: number;
  rsiPeriod: number;
  rsiOversold: number;
  rsiOverbought: number;
}

export const DEFAULT_SIGNAL_CONFIG: SignalConfig = {
  smaShortPeriod: 10,
  smaLongPeriod: 30,
  rsiPeriod: 14,
  rsiOversold: 30,
  rsiOverbought: 70,
};

/**
 * Calcule un signal BUY/SELL/HOLD à partir des bougies.
 *
 * Stratégie (simple, volontairement lisible) :
 *  - Croisement de moyennes mobiles : SMA courte > SMA longue → biais haussier.
 *  - RSI : < oversold → survente (achat), > overbought → surachat (vente).
 *  - Chaque condition vote ; l'action gagnante l'emporte, la confiance dépend
 *    du nombre de votes concordants.
 */
export function computeSignal(
  asset: Asset,
  candles: Candle[],
  config: SignalConfig = DEFAULT_SIGNAL_CONFIG,
): Signal {
  const closes = candles.map((c) => c.close);
  const price = closes.length ? closes[closes.length - 1]! : 0;

  const smaShort = sma(closes, config.smaShortPeriod);
  const smaLong = sma(closes, config.smaLongPeriod);
  const rsiValue = rsi(closes, config.rsiPeriod);

  const reasons: string[] = [];
  let buyVotes = 0;
  let sellVotes = 0;

  if (smaShort !== undefined && smaLong !== undefined) {
    if (smaShort > smaLong) {
      buyVotes++;
      reasons.push(
        `SMA${config.smaShortPeriod} (${smaShort.toFixed(2)}) au-dessus de SMA${config.smaLongPeriod} (${smaLong.toFixed(2)}) → tendance haussière`,
      );
    } else if (smaShort < smaLong) {
      sellVotes++;
      reasons.push(
        `SMA${config.smaShortPeriod} (${smaShort.toFixed(2)}) sous SMA${config.smaLongPeriod} (${smaLong.toFixed(2)}) → tendance baissière`,
      );
    }
  }

  if (rsiValue !== undefined) {
    if (rsiValue < config.rsiOversold) {
      buyVotes++;
      reasons.push(`RSI ${rsiValue.toFixed(1)} < ${config.rsiOversold} → survente`);
    } else if (rsiValue > config.rsiOverbought) {
      sellVotes++;
      reasons.push(`RSI ${rsiValue.toFixed(1)} > ${config.rsiOverbought} → surachat`);
    } else {
      reasons.push(`RSI ${rsiValue.toFixed(1)} → neutre`);
    }
  }

  let action: SignalAction = "HOLD";
  if (buyVotes > sellVotes) action = "BUY";
  else if (sellVotes > buyVotes) action = "SELL";

  const totalSignals = 2; // SMA + RSI
  const dominant = Math.max(buyVotes, sellVotes);
  const confidence = action === "HOLD" ? 0.25 : Math.min(1, dominant / totalSignals);

  if (reasons.length === 0) {
    reasons.push("Données insuffisantes pour calculer des indicateurs fiables");
  }

  return {
    asset,
    price,
    changePct: changePct(closes),
    action,
    confidence,
    indicators: { smaShort, smaLong, rsi: rsiValue },
    reasons,
    computedAt: Date.now(),
  };
}
