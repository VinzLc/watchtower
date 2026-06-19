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
| [`packages/server`](packages/server) | Backend Fastify : providers crypto (Binance) + actions (Finnhub), API REST |
| [`packages/web`](packages/web) | Dashboard Vite + React, auto-refresh |

## Démarrage

```bash
pnpm install
cp .env.example .env   # optionnel : ajouter FINNHUB_API_KEY pour les actions
pnpm dev               # lance server (:3001) + web (:5173) en parallèle
```

- Dashboard : http://localhost:5173
- API : http://localhost:3001/api/signals

## Sources de données

- **Crypto** — API publique Binance, aucune clé requise (BTC, ETH, ...).
- **Actions** — Finnhub, nécessite une clé gratuite (`FINNHUB_API_KEY`). Sans clé,
  seules les cryptos sont affichées.

## Signaux

Pour chaque actif, Watchtower calcule à partir des bougies récentes :
- **SMA** (moyennes mobiles courte/longue) → croisement haussier/baissier
- **RSI** → survente (<30) / surachat (>70)

Et en déduit une recommandation : `BUY` / `SELL` / `HOLD` avec un score de confiance
et les raisons. Les seuils sont configurables dans
[`packages/shared/src/signals.ts`](packages/shared/src/signals.ts).

## Roadmap

- [ ] Alertes (Telegram / Discord / email) sur changement de signal
- [ ] Graphiques (chandeliers + indicateurs) dans le dashboard
- [ ] Backtesting des stratégies sur données historiques
- [ ] Persistance (historique des signaux)
