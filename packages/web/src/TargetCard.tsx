import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import {
  NOTED_DIVERGENCE_WARN_PCT,
  type TargetEvaluation,
  type TargetStatus,
} from "@watchtower/shared";

const STATUS_LABEL: Record<TargetStatus, string> = {
  BUY_ZONE: "ZONE D'ACHAT",
  APPROACHING: "PROCHE",
  WAIT: "ATTENDRE",
};

const STATUS_CLASS: Record<TargetStatus, string> = {
  BUY_ZONE: "buy",
  APPROACHING: "approach",
  WAIT: "wait",
};

function fmt(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(
    value,
  );
}

export function TargetCard({ ev }: { ev: TargetEvaluation }) {
  const { target, livePrice, distancePct, status, notedDivergencePct } = ev;
  const cls = STATUS_CLASS[status];

  const data = ev.candles.map((c) => ({ t: c.time, price: c.close }));
  const prices = data.map((d) => d.price);
  // L'échelle inclut la cible pour qu'on visualise la distance à parcourir.
  const min = Math.min(...prices, target.target);
  const max = Math.max(...prices, target.target);
  const pad = (max - min) * 0.08 || 1;

  const diverges =
    notedDivergencePct !== undefined &&
    Math.abs(notedDivergencePct) > NOTED_DIVERGENCE_WARN_PCT;

  return (
    <article className={`target target--${cls}`}>
      <div className="target__top">
        <div>
          <h3 className="target__label">{target.label}</h3>
          <span className="target__symbol">
            {target.kind === "crypto" ? "🪙" : "📈"} {target.symbol}
          </span>
        </div>
        <span className={`badge badge--${cls}`}>{STATUS_LABEL[status]}</span>
      </div>

      <div className="target__prices">
        <div>
          <span className="target__muted">prix actuel</span>
          <strong>{fmt(livePrice)}</strong>
        </div>
        <div className="target__arrow">{distancePct >= 0 ? "↓" : "↑"}</div>
        <div>
          <span className="target__muted">cible James</span>
          <strong className="target__goal">{fmt(target.target)}</strong>
        </div>
      </div>

      <div className={`target__dist target__dist--${cls}`}>
        {distancePct >= 0
          ? `${fmt(distancePct)}% au-dessus de la cible`
          : `${fmt(Math.abs(distancePct))}% sous la cible ✅`}
      </div>

      <div className="target__chart">
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`grad-${cls}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={[min - pad, max + pad]} />
            <Tooltip
              contentStyle={{
                background: "#0b0f1a",
                border: "1px solid #25304d",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(t) =>
                new Date(Number(t)).toLocaleDateString("fr-FR")
              }
              formatter={(v) => [fmt(Number(v)), "prix"]}
            />
            <ReferenceLine
              y={target.target}
              stroke="var(--accent)"
              strokeDasharray="4 3"
              label={{
                value: `cible ${fmt(target.target)}`,
                position: "insideBottomRight",
                fill: "var(--accent)",
                fontSize: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="var(--text)"
              strokeWidth={1.6}
              fill={`url(#grad-${cls})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {target.note && <p className="target__note">{target.note}</p>}

      {diverges && (
        <p className="target__warn">
          ⚠️ Écart de {fmt(notedDivergencePct!)}% avec le prix noté par James
          ({fmt(target.notedPrice!)}) — vérifier le ticker / la donnée.
        </p>
      )}
    </article>
  );
}
