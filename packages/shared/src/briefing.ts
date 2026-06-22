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
  /**
   * Notre propre cible d'achat, moins précise que celle de James : on se
   * laisse une marge (généralement un prix plus haut, donc plus tolérant).
   */
  vinzTarget?: number;
  /** Commentaire sur la cible Vinz. */
  vinzNote?: string;
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
  /** Écart en % entre le prix live et notre propre cible, si définie. */
  vinzDistancePct?: number;
  /** Statut de notre propre cible, si définie. */
  vinzStatus?: TargetStatus;
  /** Bougies récentes pour le graphique. */
  candles: Candle[];
}

/** Marge (%) sous laquelle on considère qu'on "approche" de la cible. */
export const APPROACHING_MARGIN_PCT = 5;

/** Au-delà de cet écart avec le prix noté par James, on lève un avertissement. */
export const NOTED_DIVERGENCE_WARN_PCT = 25;

/** Calcule l'écart en % et le statut d'un prix live par rapport à une cible. */
function distanceAndStatus(
  livePrice: number,
  goal: number,
): { distancePct: number; status: TargetStatus } {
  const distancePct = goal > 0 ? ((livePrice - goal) / goal) * 100 : 0;

  let status: TargetStatus;
  if (livePrice <= goal) status = "BUY_ZONE";
  else if (distancePct <= APPROACHING_MARGIN_PCT) status = "APPROACHING";
  else status = "WAIT";

  return { distancePct, status };
}

type WatchingEntry = Briefing["watching"][number];

interface MergedAssetEntry {
  updatedAt: string;
  kind: "target" | "watching";
  target?: PriceTarget;
  watching?: WatchingEntry;
}

/**
 * Fusionne les cibles et actifs surveillés de TOUS les briefings en un seul état courant
 * par actif (clé = kind + symbole) : chaque nouveau briefing met à jour l'actif s'il en
 * reparle (cible ou commentaire plus récent gagne), mais un actif non mentionné dans le
 * dernier briefing n'est jamais perdu — il reste affiché tel que défini par James la
 * dernière fois qu'il en a parlé.
 */
export function mergeAssetState(briefings: Briefing[]): {
  targets: PriceTarget[];
  watching: WatchingEntry[];
} {
  const chronological = [...briefings].sort((a, b) => a.date.localeCompare(b.date));
  const byAsset = new Map<string, MergedAssetEntry>();

  for (const b of chronological) {
    for (const t of b.targets) {
      byAsset.set(`${t.kind}:${t.symbol.toUpperCase()}`, {
        updatedAt: b.date,
        kind: "target",
        target: t,
      });
    }
    for (const w of b.watching) {
      byAsset.set(`${w.kind}:${w.symbol.toUpperCase()}`, {
        updatedAt: b.date,
        kind: "watching",
        watching: w,
      });
    }
  }

  const entries = [...byAsset.values()].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );

  return {
    targets: entries.flatMap((e) => (e.target ? [e.target] : [])),
    watching: entries.flatMap((e) => (e.watching ? [e.watching] : [])),
  };
}

/** Évalue le statut d'une cible par rapport au prix de marché en direct. */
export function evaluateTarget(
  target: PriceTarget,
  livePrice: number,
  candles: Candle[] = [],
): TargetEvaluation {
  const { distancePct, status } = distanceAndStatus(livePrice, target.target);

  let notedDivergencePct: number | undefined;
  if (target.notedPrice && target.notedPrice > 0) {
    notedDivergencePct =
      ((livePrice - target.notedPrice) / target.notedPrice) * 100;
  }

  let vinzDistancePct: number | undefined;
  let vinzStatus: TargetStatus | undefined;
  if (target.vinzTarget && target.vinzTarget > 0) {
    const vinz = distanceAndStatus(livePrice, target.vinzTarget);
    vinzDistancePct = vinz.distancePct;
    vinzStatus = vinz.status;
  }

  return {
    target,
    livePrice,
    distancePct,
    status,
    notedDivergencePct,
    vinzDistancePct,
    vinzStatus,
    candles,
  };
}
