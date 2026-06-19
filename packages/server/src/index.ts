import Fastify from "fastify";
import cors from "@fastify/cors";
import { config, WATCHLIST } from "./config.js";
import { computeAllSignals } from "./market.js";
import { stocksEnabled } from "./providers/stocks.js";
import { BRIEFINGS, CURRENT_BRIEFING } from "./data/briefings.js";
import { evaluateTargets } from "./plan.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: config.webOrigin });

app.get("/api/health", async () => ({
  status: "ok",
  stocksEnabled: stocksEnabled(),
  watchlist: WATCHLIST.length,
}));

app.get("/api/watchlist", async () => WATCHLIST);

/** Liste des briefings de James (métadonnées). */
app.get("/api/briefings", async () =>
  BRIEFINGS.map(({ id, title, date, tldr }) => ({ id, title, date, tldr })),
);

/**
 * Plan en cours : le briefing actif de James + ses cibles évaluées en direct
 * (prix live, écart à la cible, statut zone d'achat, bougies pour les graphes).
 */
app.get("/api/plan", async (_req, reply) => {
  try {
    const targets = await evaluateTargets(CURRENT_BRIEFING.targets);
    return { briefing: CURRENT_BRIEFING, targets };
  } catch (err) {
    app.log.error(err);
    reply.code(502);
    return { error: "Impossible de récupérer le plan" };
  }
});

app.get("/api/signals", async (_req, reply) => {
  try {
    const signals = await computeAllSignals();
    return signals;
  } catch (err) {
    app.log.error(err);
    reply.code(502);
    return { error: "Impossible de calculer les signaux" };
  }
});

try {
  await app.listen({ port: config.port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
