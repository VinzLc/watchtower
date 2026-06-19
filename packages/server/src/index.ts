import Fastify from "fastify";
import cors from "@fastify/cors";
import { config, WATCHLIST } from "./config.js";
import { computeAllSignals } from "./market.js";
import { stocksEnabled } from "./providers/stocks.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: config.webOrigin });

app.get("/api/health", async () => ({
  status: "ok",
  stocksEnabled: stocksEnabled(),
  watchlist: WATCHLIST.length,
}));

app.get("/api/watchlist", async () => WATCHLIST);

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
  if (!stocksEnabled()) {
    app.log.warn(
      "FINNHUB_API_KEY absente → actions désactivées (crypto uniquement).",
    );
  }
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
