import { useEffect, useState } from "react";
import type { Signal } from "@watchtower/shared";
import { fetchSignals } from "./api.js";
import { SignalCard } from "./SignalCard.js";

const REFRESH_MS = 30_000;

export function App() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await fetchSignals();
        if (!active) return;
        setSignals(data);
        setError(null);
        setUpdatedAt(Date.now());
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <main className="app">
      <header className="app__header">
        <h1>🗼 Watchtower</h1>
        <p className="app__subtitle">
          Signaux d'achat / vente — actions &amp; crypto
        </p>
        {updatedAt && (
          <span className="app__updated">
            Mis à jour à {new Date(updatedAt).toLocaleTimeString("fr-FR")}
          </span>
        )}
      </header>

      {error && (
        <div className="app__error">
          ⚠️ {error}
          <br />
          <small>Le backend est-il lancé ? (`pnpm dev`)</small>
        </div>
      )}

      {loading && signals.length === 0 && !error && (
        <p className="app__loading">Chargement des signaux…</p>
      )}

      {!loading && signals.length === 0 && !error && (
        <p className="app__loading">
          Aucun signal. Ajoute une `FINNHUB_API_KEY` pour les actions, la crypto
          devrait apparaître automatiquement.
        </p>
      )}

      <section className="grid">
        {signals.map((s) => (
          <SignalCard key={s.asset.id} signal={s} />
        ))}
      </section>

      <footer className="app__footer">
        Outil d'aide à la décision — ceci n'est pas un conseil financier.
      </footer>
    </main>
  );
}
