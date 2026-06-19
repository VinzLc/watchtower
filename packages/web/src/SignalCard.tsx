import type { Signal, SignalAction } from "@watchtower/shared";

const ACTION_LABEL: Record<SignalAction, string> = {
  BUY: "ACHETER",
  SELL: "VENDRE",
  HOLD: "ATTENDRE",
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: value >= 100 ? 2 : 4,
  }).format(value);
}

export function SignalCard({ signal }: { signal: Signal }) {
  const { asset, price, changePct, action, confidence, indicators, reasons } =
    signal;
  const up = changePct >= 0;

  return (
    <article className={`card card--${action.toLowerCase()}`}>
      <div className="card__top">
        <div>
          <h2 className="card__label">{asset.label}</h2>
          <span className="card__symbol">
            {asset.kind === "crypto" ? "🪙" : "📈"} {asset.symbol}
          </span>
        </div>
        <span className={`badge badge--${action.toLowerCase()}`}>
          {ACTION_LABEL[action]}
        </span>
      </div>

      <div className="card__price">
        <strong>{formatPrice(price)}</strong>
        <span className={up ? "delta delta--up" : "delta delta--down"}>
          {up ? "▲" : "▼"} {changePct.toFixed(2)}%
        </span>
      </div>

      <div className="card__confidence">
        <div className="bar">
          <div
            className={`bar__fill bar__fill--${action.toLowerCase()}`}
            style={{ width: `${Math.round(confidence * 100)}%` }}
          />
        </div>
        <span>confiance {Math.round(confidence * 100)}%</span>
      </div>

      <ul className="card__indicators">
        {indicators.smaShort !== undefined && (
          <li>SMA court {indicators.smaShort.toFixed(2)}</li>
        )}
        {indicators.smaLong !== undefined && (
          <li>SMA long {indicators.smaLong.toFixed(2)}</li>
        )}
        {indicators.rsi !== undefined && (
          <li>RSI {indicators.rsi.toFixed(1)}</li>
        )}
      </ul>

      <ul className="card__reasons">
        {reasons.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </article>
  );
}
