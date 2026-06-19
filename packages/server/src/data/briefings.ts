import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { Briefing } from "@watchtower/shared";

/**
 * Les briefings de James sont stockés dans briefings.json (modifiable par le
 * script d'ingestion `pnpm --filter @watchtower/server run ingest`).
 */
export const BRIEFINGS_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "briefings.json",
);

/** Charge les briefings, triés du plus récent au plus ancien. */
export function loadBriefings(): Briefing[] {
  const raw = JSON.parse(readFileSync(BRIEFINGS_PATH, "utf8")) as Briefing[];
  return [...raw].sort((a, b) => b.date.localeCompare(a.date));
}

export const BRIEFINGS: Briefing[] = loadBriefings();

/** Le briefing actif (le plus récent). */
export const CURRENT_BRIEFING = BRIEFINGS[0]!;
