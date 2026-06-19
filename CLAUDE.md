# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

Watchtower reflects investment briefings from **James** (a mentor) on a real-time dashboard. James sends text briefings; the job of this app is to convert each briefing into structured data (price targets, stance, macro notes) and track, live, the gap between market price and James's buy targets. It is **not** a generic technical screener — the briefing/targets are the hero feature; SMA/RSI signals are secondary.

When James sends a new briefing, add it as a new structured entry at the top of `BRIEFINGS` in `packages/server/src/data/briefings.ts` (most-recent-first). `CURRENT_BRIEFING` drives `/api/plan`.

## Commands

Run everything from the repo root (pnpm workspace).

```bash
pnpm install
cp .env.example .env        # set free PORT / WEB_PORT (see Gotchas)
pnpm dev                    # server + web in parallel
pnpm dev:server             # backend only
pnpm dev:web                # dashboard only
pnpm typecheck              # tsc --noEmit across all packages
pnpm build                  # build all packages
pnpm --filter @watchtower/server run snapshot   # generate static data JSON for Pages
```

There is **no test runner and no linter** configured — `pnpm typecheck` is the only automated check. Validate UI changes with a production build (`pnpm --filter @watchtower/web run build`), which runs `tsc` then `vite build`.

## Architecture

pnpm monorepo, 3 packages, ESM + TypeScript throughout:

- **`packages/shared`** — pure domain logic, no deps. Consumed as **source** (`main` points at `src/index.ts`); both server (tsx) and web (Vite) import TS directly, so there is no build step to keep in sync. Contains: indicator math (`indicators.ts`: SMA/EMA/RSI), signal voting (`signals.ts`: SMA-cross + RSI → BUY/SELL/HOLD), and the briefing model + `evaluateTarget` (`briefing.ts`: live price vs target → BUY_ZONE/APPROACHING/WAIT).
- **`packages/server`** — Fastify API. `providers/crypto.ts` (Binance public, no key) and `providers/stocks.ts` (Yahoo Finance public, no key) both return a normalized `Candle[]`. `market.ts` computes technical signals for `WATCHLIST` (`config.ts`); `plan.ts` enriches `CURRENT_BRIEFING.targets` with live candles. All provider calls use `Promise.allSettled` so one failing symbol never breaks the response.
- **`packages/web`** — Vite + React dashboard, recharts for graphs. `App.tsx` polls every 30 s; `PlanHeader.tsx` + `TargetCard.tsx` render the plan, `SignalCard.tsx` the technical signals.

### Data flow has two modes (this is the key design point)

`packages/web/src/api.ts` switches on `import.meta.env.DEV`:
- **dev** → fetches `/api/plan` and `/api/signals`, proxied by Vite to the backend (live, real-time).
- **prod** (GitHub Pages, static, no backend) → fetches `${BASE_URL}data/*.json`, a snapshot produced by `packages/server/src/snapshot.ts` and written to `packages/web/public/data/`.

The committed `public/data/*.json` is **seed/fallback data**. The deployed site always uses fresh JSON regenerated in CI; `.github/workflows/deploy.yml` runs the snapshot (best-effort, `|| true`), builds with `BASE_PATH=/watchtower/`, and deploys to Pages on push + every 30 min. If the CI snapshot fails, the committed seed is deployed instead.

## Gotchas

- **Env loading is manual.** Nothing uses dotenv. `config.ts` calls `process.loadEnvFile()` on the repo-root `.env` (resolved relative to the source file), and `vite.config.ts` reads the same root `.env` via `loadEnv` so the proxy target (`PORT`) and dev port (`WEB_PORT`) stay in sync. Add new env vars in both places if both sides need them.
- **Ports collide with other local projects.** This machine runs several apps; the chosen defaults are `PORT=4010` / `WEB_PORT=5180`. The dev server uses `strictPort`, so pick genuinely free ports in `.env`.
- **Yahoo Finance has no CORS** — stocks must be fetched server-side (backend in dev, CI runner for the snapshot), never directly from the browser. Binance does send CORS headers. This is why a pure static deploy can't fetch stocks live and relies on the snapshot. Yahoo also rejects requests without a `User-Agent` header (set in `providers/stocks.ts`).
- **`base` path matters for Pages.** Production builds use `/watchtower/`; static data is fetched via `import.meta.env.BASE_URL` so it resolves under the subpath.
- **No commit-back from CI.** The scheduled workflow regenerates data only inside the build artifact; it does not push updated JSON to the repo.
