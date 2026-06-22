import type { Briefing, Signal, TargetEvaluation } from "@watchtower/shared";

// En dev : appels live au backend via le proxy /api.
// En prod (GitHub Pages, sans backend) : lecture du snapshot JSON statique.
const STATIC = !import.meta.env.DEV;
const BASE = import.meta.env.BASE_URL;

export interface PlanResponse {
  briefing: Briefing;
  targets: TargetEvaluation[];
  /** Présent dans le snapshot statique. */
  generatedAt?: number;
}

// Le snapshot statique est servi avec cache-control: max-age=600 par GitHub
// Pages : un simple fetch() réutiliserait le cache HTTP du navigateur jusqu'à
// 10 min, ce qui annule l'intérêt du polling toutes les 30s. On bypass via
// cache: "no-store" pour que chaque poll aille vérifier la fraîcheur réelle.
export async function fetchPlan(): Promise<PlanResponse> {
  const url = STATIC ? `${BASE}data/plan.json` : "/api/plan";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`plan: HTTP ${res.status}`);
  }
  return (await res.json()) as PlanResponse;
}

export async function fetchSignals(): Promise<Signal[]> {
  const url = STATIC ? `${BASE}data/signals.json` : "/api/signals";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`signals: HTTP ${res.status}`);
  }
  const data = (await res.json()) as Signal[] | { signals: Signal[] };
  return Array.isArray(data) ? data : data.signals;
}
