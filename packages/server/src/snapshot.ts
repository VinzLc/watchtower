import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { BRIEFINGS, CURRENT_BRIEFING } from "./data/briefings.js";
import { evaluateTargets } from "./plan.js";
import { computeAllSignals } from "./market.js";
import { mergeAssetState } from "@watchtower/shared";

/**
 * Génère un snapshot statique des données pour un hébergement sans backend
 * (GitHub Pages). Écrit des fichiers JSON dans le dossier `public/data` du web.
 */
const outDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../web/public/data",
);

const generatedAt = Date.now();

const { targets: mergedTargets, watching } = mergeAssetState(BRIEFINGS);

const [targets, signals] = await Promise.all([
  evaluateTargets(mergedTargets),
  computeAllSignals(),
]);

await mkdir(outDir, { recursive: true });

await writeFile(
  resolve(outDir, "plan.json"),
  JSON.stringify(
    { briefing: { ...CURRENT_BRIEFING, watching }, targets, generatedAt },
    null,
    2,
  ),
);

await writeFile(
  resolve(outDir, "signals.json"),
  JSON.stringify({ signals, generatedAt }, null, 2),
);

await writeFile(
  resolve(outDir, "briefings.json"),
  JSON.stringify(
    BRIEFINGS.map(({ id, title, date, tldr }) => ({ id, title, date, tldr })),
    null,
    2,
  ),
);

console.log(
  `Snapshot écrit dans ${outDir} : ${targets.length} cibles, ${signals.length} signaux.`,
);

if (targets.length === 0 && signals.length === 0) {
  console.error("⚠️ Snapshot vide — providers injoignables ?");
  process.exit(1);
}
