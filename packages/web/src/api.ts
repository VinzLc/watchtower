import type { Signal } from "@watchtower/shared";

export async function fetchSignals(): Promise<Signal[]> {
  const res = await fetch("/api/signals");
  if (!res.ok) {
    throw new Error(`API /api/signals: HTTP ${res.status}`);
  }
  return (await res.json()) as Signal[];
}
