# 🗼 Watchtower

Surveille **actions** et **crypto** pour repérer les bons moments d'achat/vente,
via un dashboard temps réel et des signaux techniques (SMA / EMA / RSI).

> ⚠️ Watchtower est un outil d'aide à la décision et d'apprentissage.
> Ce n'est **pas** un conseil financier. Aucune garantie sur les signaux.

## Architecture

Monorepo pnpm avec 3 packages :

| Package | Rôle |
|---|---|
| [`packages/shared`](packages/shared) | Types communs, calculs d'indicateurs (SMA/EMA/RSI), logique de signal |
| [`packages/server`](packages/server) | Backend Fastify : providers crypto (Binance) + actions (Yahoo Finance), API REST |
| [`packages/web`](packages/web) | Dashboard Vite + React, auto-refresh |

## Démarrage

```bash
pnpm install
cp .env.example .env   # choisis un PORT libre (défaut 4010)
pnpm dev               # lance server + web (:5173) en parallèle
```

- Dashboard : http://localhost:5173
- API : http://localhost:4010/api/signals (selon PORT)

Le dashboard proxifie `/api/*` vers le backend en lisant le `PORT` du `.env`,
donc les deux restent synchronisés automatiquement.

## Sources de données

Aucune clé API requise :

- **Crypto** — API publique Binance (BTC, ETH, SOL, ...).
- **Actions** — API publique Yahoo Finance (AAPL, MSFT, NVDA, ...).

## Signaux

Pour chaque actif, Watchtower calcule à partir des bougies récentes :
- **SMA** (moyennes mobiles courte/longue) → croisement haussier/baissier
- **RSI** → survente (<30) / surachat (>70)

Et en déduit une recommandation : `BUY` / `SELL` / `HOLD` avec un score de confiance
et les raisons. Les seuils sont configurables dans
[`packages/shared/src/signals.ts`](packages/shared/src/signals.ts).

## Déploiement (GitHub Pages)

Le dashboard est publié sur GitHub Pages : **https://vinzlc.github.io/watchtower/**

Comme Pages est 100 % statique (pas de backend), un snapshot des données est
généré par [`pnpm --filter @watchtower/server snapshot`](packages/server/src/snapshot.ts)
(écrit dans `packages/web/public/data/`), puis le dashboard lit ce JSON en prod.
Le workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
régénère le snapshot et redéploie **toutes les 30 min** (et à chaque push).

> En local (`pnpm dev`), le dashboard appelle le backend en direct (temps réel).
> En prod, il lit le dernier snapshot. Pour du vrai temps réel en ligne, héberger
> le backend (Render / Fly / Railway) et pointer le front dessus.

## Roadmap

- [ ] Alertes (Telegram / Discord / email) sur changement de signal
- [ ] Graphiques (chandeliers + indicateurs) dans le dashboard
- [ ] Backtesting des stratégies sur données historiques
- [ ] Persistance (historique des signaux)
