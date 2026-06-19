export type AssetKind = "crypto" | "stock";

/** Un actif suivi par Watchtower. */
export interface Asset {
  /** Identifiant interne stable, ex: "crypto:BTCUSDT" ou "stock:AAPL". */
  id: string;
  kind: AssetKind;
  /** Symbole tel qu'utilisé par le provider, ex: "BTCUSDT", "AAPL". */
  symbol: string;
  /** Nom affiché, ex: "Bitcoin", "Apple". */
  label: string;
}

/** Une bougie OHLC. */
export interface Candle {
  /** Timestamp d'ouverture en ms epoch. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type SignalAction = "BUY" | "SELL" | "HOLD";

/** Résultat de l'analyse d'un actif. */
export interface Signal {
  asset: Asset;
  /** Dernier prix connu. */
  price: number;
  /** Variation % sur la fenêtre analysée. */
  changePct: number;
  action: SignalAction;
  /** Confiance 0..1. */
  confidence: number;
  /** Indicateurs calculés (peut contenir des champs absents si données insuffisantes). */
  indicators: {
    smaShort?: number;
    smaLong?: number;
    rsi?: number;
  };
  /** Explications lisibles du pourquoi de l'action. */
  reasons: string[];
  /** Timestamp de calcul, ms epoch. */
  computedAt: number;
}

export interface ApiError {
  error: string;
}
