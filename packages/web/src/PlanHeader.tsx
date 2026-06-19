import type { Briefing } from "@watchtower/shared";

export function PlanHeader({ briefing }: { briefing: Briefing }) {
  const date = new Date(briefing.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="plan">
      <div className="plan__head">
        <div>
          <span className="plan__from">📡 Briefing de James</span>
          <h2 className="plan__title">{briefing.title}</h2>
          <span className="plan__date">{date}</span>
        </div>
      </div>

      <p className="plan__tldr">{briefing.tldr}</p>

      <div className="plan__cols">
        <div className="plan__col">
          <h3>🎯 Positionnement</h3>
          <ul>
            {briefing.stance.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="plan__col">
          <h3>🌍 Macro</h3>
          <ul>
            {briefing.macro.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      </div>

      {briefing.watching.length > 0 && (
        <div className="plan__watching">
          <h3>👀 Sous surveillance</h3>
          {briefing.watching.map((w) => (
            <p key={w.symbol}>
              <strong>{w.label}</strong> — {w.note}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
