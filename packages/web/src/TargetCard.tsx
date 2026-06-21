import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
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

function Chart({
  ev,
  cls,
  expanded = false,
}: {
  ev: TargetEvaluation;
  cls: string;
  expanded?: boolean;
}) {
  const { target } = ev;
  const data = ev.candles.map((c) => ({ t: c.time, price: c.close }));
  const prices = data.map((d) => d.price);
  // L'échelle inclut les deux cibles pour qu'on visualise la distance à parcourir.
  const goals = [target.target, ...(target.vinzTarget ? [target.vinzTarget] : [])];
  const min = Math.min(...prices, ...goals);
  const max = Math.max(...prices, ...goals);
  const pad = (max - min) * 0.08 || 1;

  return (
    <ResponsiveContainer width="100%" height={expanded ? "100%" : 90}>
      <AreaChart
        data={data}
        margin={
          expanded
            ? { top: 12, right: 16, bottom: 8, left: 8 }
            : { top: 4, right: 0, bottom: 0, left: 0 }
        }
      >
        <defs>
          <linearGradient id={`grad-${cls}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        {expanded && (
          <CartesianGrid
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />
        )}
        {expanded && (
          <XAxis
            dataKey="t"
            tickFormatter={(t) => new Date(Number(t)).toLocaleDateString("fr-FR")}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            stroke="rgba(255,255,255,0.1)"
            minTickGap={40}
          />
        )}
        <YAxis
          hide={!expanded}
          domain={[min - pad, max + pad]}
          orientation="right"
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          stroke="rgba(255,255,255,0.1)"
          tickFormatter={(v) => fmt(Number(v))}
          width={expanded ? 56 : 0}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(11, 16, 32, 0.92)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: 10,
            fontSize: 12,
            backdropFilter: "blur(8px)",
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
            value: `James ${fmt(target.target)}`,
            position: "insideBottomRight",
            fill: "var(--accent)",
            fontSize: expanded ? 12 : 10,
          }}
        />
        {target.vinzTarget && (
          <ReferenceLine
            y={target.vinzTarget}
            stroke="var(--vinz)"
            strokeDasharray="4 3"
            label={{
              value: `Vinz ${fmt(target.vinzTarget)}`,
              position: "insideTopRight",
              fill: "var(--vinz)",
              fontSize: expanded ? 12 : 10,
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey="price"
          stroke="var(--text)"
          strokeWidth={expanded ? 2 : 1.6}
          fill={`url(#grad-${cls})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ChartModal({
  ev,
  cls,
  onClose,
}: {
  ev: TargetEvaluation;
  cls: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div className="chart-modal" onClick={onClose}>
      <div
        className={`chart-modal__panel target--${cls}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="chart-modal__head">
          <div>
            <h3 className="target__label">{ev.target.label}</h3>
            <span className="target__symbol">
              {ev.target.kind === "crypto" ? "🪙" : "📈"} {ev.target.symbol}
            </span>
          </div>
          <button className="chart-modal__close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="chart-modal__body">
          <Chart ev={ev} cls={cls} expanded />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function TargetCard({ ev }: { ev: TargetEvaluation }) {
  const { target, livePrice, distancePct, status, notedDivergencePct, vinzStatus } =
    ev;
  const cls = STATUS_CLASS[status];
  const [fullscreen, setFullscreen] = useState(false);

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
        <div className="target__badges">
          <span className={`badge badge--${cls}`}>{STATUS_LABEL[status]}</span>
          {vinzStatus && (
            <span className={`badge badge--vinz`}>
              Vinz · {STATUS_LABEL[vinzStatus]}
            </span>
          )}
        </div>
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
        {target.vinzTarget && (
          <div>
            <span className="target__muted">cible Vinz</span>
            <strong className="target__goal target__goal--vinz">
              {fmt(target.vinzTarget)}
            </strong>
          </div>
        )}
      </div>

      <div className={`target__dist target__dist--${cls}`}>
        {distancePct >= 0
          ? `${fmt(distancePct)}% au-dessus de la cible James`
          : `${fmt(Math.abs(distancePct))}% sous la cible James ✅`}
      </div>

      {target.vinzTarget && ev.vinzDistancePct !== undefined && (
        <div className="target__dist--vinz">
          {ev.vinzDistancePct >= 0
            ? `${fmt(ev.vinzDistancePct)}% au-dessus de la cible Vinz`
            : `${fmt(Math.abs(ev.vinzDistancePct))}% sous la cible Vinz ✅`}
        </div>
      )}

      <div className="target__chart">
        <button
          className="target__expand"
          onClick={() => setFullscreen(true)}
          aria-label="Afficher le graphe en plein écran"
          title="Plein écran"
        >
          ⤢
        </button>
        <Chart ev={ev} cls={cls} />
      </div>

      {fullscreen && (
        <ChartModal ev={ev} cls={cls} onClose={() => setFullscreen(false)} />
      )}

      {target.note && <p className="target__note">{target.note}</p>}
      {target.vinzNote && (
        <p className="target__note">
          <strong style={{ color: "var(--vinz)" }}>Vinz :</strong>{" "}
          {target.vinzNote}
        </p>
      )}

      {diverges && (
        <p className="target__warn">
          ⚠️ Écart de {fmt(notedDivergencePct!)}% avec le prix noté par James
          ({fmt(target.notedPrice!)}) — vérifier le ticker / la donnée.
        </p>
      )}
    </article>
  );
}
