import { useEffect, useState } from "react";
import type { Signal } from "@watchtower/shared";
import { fetchPlan, fetchSignals, type PlanResponse } from "./api.js";
import { PlanHeader } from "./PlanHeader.js";
import { TargetCard } from "./TargetCard.js";
import { SignalCard } from "./SignalCard.js";

const REFRESH_MS = 30_000;

export function App() {
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [p, s] = await Promise.all([fetchPlan(), fetchSignals()]);
        if (!active) return;
        setPlan(p);
        setSignals(s);
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
          Le plan de James, reflété en temps réel
        </p>
        {updatedAt && (
          <span className="app__updated">
            Mis à jour à {new Date(updatedAt).toLocaleTimeString("fr-FR")} ·
            actualisation auto 30 s
          </span>
        )}
      </header>

      {error && (
        <div className="app__error">
          ⚠️ {error}
          <br />
          <small>Le backend est-il lancé ? (`pnpm dev` depuis watchtower/)</small>
        </div>
      )}

      {loading && !plan && !error && (
        <p className="app__loading">Chargement du plan…</p>
      )}

      {plan && (
        <>
          <PlanHeader briefing={plan.briefing} />

          <h2 className="section-title">🎯 Cibles d'achat de James</h2>
          <section className="grid grid--targets">
            {plan.targets.map((ev) => (
              <TargetCard key={ev.target.symbol} ev={ev} />
            ))}
          </section>
        </>
      )}

      {signals.length > 0 && (
        <>
          <h2 className="section-title">📊 Signaux techniques (SMA / RSI)</h2>
          <section className="grid">
            {signals.map((s) => (
              <SignalCard key={s.asset.id} signal={s} />
            ))}
          </section>
        </>
      )}

      <footer className="app__footer">
        Outil d'aide à la décision basé sur les briefings de James — ceci n'est
        pas un conseil financier.
      </footer>
    </main>
  );
}
