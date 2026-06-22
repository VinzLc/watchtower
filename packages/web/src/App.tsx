import { useEffect, useState } from "react";
import { fetchPlan, type PlanResponse } from "./api.js";
import { PlanHeader } from "./PlanHeader.js";
import { TargetCard } from "./TargetCard.js";

const REFRESH_MS = 30_000;

export function App() {
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const p = await fetchPlan();
        if (!active) return;
        setPlan(p);
        setError(null);
        setUpdatedAt(p.generatedAt ?? Date.now());
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
        <div className="app__meta">
          {updatedAt && (
            <span className="app__updated">
              📊 Données du {new Date(updatedAt).toLocaleString("fr-FR")}
            </span>
          )}
          <span className="app__updated app__updated--deploy">
            🚀 Site déployé le {new Date(__BUILD_TIME__).toLocaleString("fr-FR")}
          </span>
        </div>
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
          <h2 className="section-title">🎯 Cibles d'achat de James</h2>
          <section className="grid grid--targets">
            {plan.targets.map((ev) => (
              <TargetCard key={ev.target.symbol} ev={ev} />
            ))}
          </section>

          <PlanHeader briefing={plan.briefing} />
        </>
      )}

      <footer className="app__footer">
        Outil d'aide à la décision basé sur les briefings de James — ceci n'est
        pas un conseil financier.
      </footer>
    </main>
  );
}
