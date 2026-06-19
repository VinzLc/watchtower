import type { Asset } from "@watchtower/shared";

export const config = {
  port: Number(process.env.PORT ?? 3001),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  finnhubApiKey: process.env.FINNHUB_API_KEY ?? "",
};

/** Liste des actifs suivis par défaut. À terme : configurable / persisté. */
export const WATCHLIST: Asset[] = [
  { id: "crypto:BTCUSDT", kind: "crypto", symbol: "BTCUSDT", label: "Bitcoin" },
  { id: "crypto:ETHUSDT", kind: "crypto", symbol: "ETHUSDT", label: "Ethereum" },
  { id: "crypto:SOLUSDT", kind: "crypto", symbol: "SOLUSDT", label: "Solana" },
  { id: "stock:AAPL", kind: "stock", symbol: "AAPL", label: "Apple" },
  { id: "stock:MSFT", kind: "stock", symbol: "MSFT", label: "Microsoft" },
  { id: "stock:NVDA", kind: "stock", symbol: "NVDA", label: "NVIDIA" },
];
