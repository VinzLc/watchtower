import type { AssetKind, Candle } from "./types.js";

/** Un prix d'achat cible défini par James pour un actif. */
export interface PriceTarget {
  symbol: string; // ex: "TSLA", "BTCUSDT"
  kind: AssetKind;
  label: string; // ex: "Tesla"
  /** Prix d'achat visé par James. */
  target: number;
  /** Prix que James a indiqué au moment du briefing (pour référence). */
  notedPrice?: number;
  /** Commentaire de James sur cette cible. */
  note?: string;
}

/** Un briefing texte de James, structuré. */
export interface Briefing {
  id: string;
  title: string;
  /** Date du briefing, ISO. */
  date: string;
  tldr: string;
  /** Texte intégral d'origine. */
  body: string;
  /** Positionnement (cash, crypto, IA, ...) en points lisibles. */
  stance: string[];
  /** Vues macro. */
  macro: string[];
  /** Prix d'achat cibles. */
  targets: PriceTarget[];
  /** Actifs juste surveillés (sans cible chiffrée ferme). */
  watching: Array<{ symbol: string; kind: AssetKind; label: string; note: string }>;
}

export type TargetStatus = "BUY_ZONE" | "APPROACHING" | "WAIT";

/** Une cible enrichie avec les données de marché en direct. */
export interface TargetEvaluation {
  target: PriceTarget;
  /** Dernier prix de marché connu. */
  livePrice: number;
  /** Écart en % entre le prix live et la cible : positif = au-dessus (doit baisser). */
  distancePct: number;
  status: TargetStatus;
  /**
   * Écart en % entre le prix live et le prix noté par James, si fourni.
   * Sert à signaler une incohérence (mauvais ticker, donnée datée...).
   */
  notedDivergencePct?: number;
  /** Bougies récentes pour le graphique. */
  candles: Candle[];
}

/** Marge (%) sous laquelle on considère qu'on "approche" de la cible. */
export const APPROACHING_MARGIN_PCT = 5;

/** Au-delà de cet écart avec le prix noté par James, on lève un avertissement. */
export const NOTED_DIVERGENCE_WARN_PCT = 25;

/** Évalue le statut d'une cible par rapport au prix de marché en direct. */
export function evaluateTarget(
  target: PriceTarget,
  livePrice: number,
  candles: Candle[] = [],
): TargetEvaluation {
  const distancePct =
    target.target > 0 ? ((livePrice - target.target) / target.target) * 100 : 0;

  let status: TargetStatus;
  if (livePrice <= target.target) status = "BUY_ZONE";
  else if (distancePct <= APPROACHING_MARGIN_PCT) status = "APPROACHING";
  else status = "WAIT";

  let notedDivergencePct: number | undefined;
  if (target.notedPrice && target.notedPrice > 0) {
    notedDivergencePct =
      ((livePrice - target.notedPrice) / target.notedPrice) * 100;
  }

  return { target, livePrice, distancePct, status, notedDivergencePct, candles };
}
