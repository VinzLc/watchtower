import type { Briefing, Signal, TargetEvaluation } from "@watchtower/shared";

export async function fetchSignals(): Promise<Signal[]> {
  const res = await fetch("/api/signals");
  if (!res.ok) {
    throw new Error(`API /api/signals: HTTP ${res.status}`);
  }
  return (await res.json()) as Signal[];
}

export interface PlanResponse {
  briefing: Briefing;
  targets: TargetEvaluation[];
}

export async function fetchPlan(): Promise<PlanResponse> {
  const res = await fetch("/api/plan");
  if (!res.ok) {
    throw new Error(`API /api/plan: HTTP ${res.status}`);
  }
  return (await res.json()) as PlanResponse;
}
