"use client";

import { motion } from "framer-motion";
import type { AuditResults } from "@/lib/supabase/types";
import { pct } from "@/lib/utils/format";

/**
 * Mock-up do dashboard que o cliente receberá no retainer. 4 cards de
 * métricas + mini-chart de projecção 6 meses (sigmoid determinística
 * baseada no citation_rate actual + target sectorial).
 */

type Props = {
  audit: AuditResults | null;
  active: boolean;
};

// Projecção sigmoid determinística — não Math.random. Modela o lift
// realista de citation rate ao longo de 6 meses dado um baseline.
// Curve: cr(t) = baseline + (target - baseline) / (1 + exp(-k*(t-mid)))
function projectCitationRate(baseline: number, target: number, months = 6): number[] {
  const k = 1.1;
  const mid = months / 2;
  const out: number[] = [];
  for (let i = 0; i <= months; i++) {
    const s = 1 / (1 + Math.exp(-k * (i - mid)));
    out.push(baseline + (target - baseline) * s);
  }
  return out;
}

function Sparkline({ values, height = 40 }: { values: number[]; height?: number }) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 120;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`}>
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <circle
        cx={w}
        cy={height - ((values[values.length - 1] - min) / range) * height}
        r={3}
        fill="currentColor"
      />
    </svg>
  );
}

export function TrackerDashboard({ audit, active }: Props) {
  const summary = audit?.summary;
  const baseline = summary?.citation_rate ?? 0;
  // Target: industry-credible mediana para B2B Tech (~30%) ou +20pp acima
  // do baseline, o que for maior. Conservador para não inflacionar.
  const target = Math.max(0.3, baseline + 0.2);
  const series = projectCitationRate(baseline, target);

  const cards = [
    {
      label: "Taxa de citação",
      value: summary ? pct(summary.citation_rate) : "—",
      target: pct(target),
    },
    {
      label: "Share of voice",
      value: summary ? pct(summary.share_of_voice) : "—",
      target: "→ subir",
    },
    {
      label: "Posição média",
      value: summary?.avg_position != null ? `#${summary.avg_position}` : "—",
      target: "→ #1",
    },
    {
      label: "Concorrentes na tua frente",
      value: String(summary?.top_competitors.length ?? 0),
      target: "→ 0",
    },
  ];

  return (
    <div className="tracker-dashboard">
      <div className="tracker-dashboard__cards">
        {cards.map((c, i) => (
          <motion.div
            className="tracker-card"
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: active ? 1 : 0, y: active ? 0 : 8 }}
            transition={{ duration: 0.35, delay: 0.04 * i }}
          >
            <span className="tracker-card__label">{c.label}</span>
            <span className="tracker-card__value">{c.value}</span>
            <span className="tracker-card__target">objectivo {c.target}</span>
          </motion.div>
        ))}
      </div>
      <div className="tracker-dashboard__chart">
        <div className="tracker-chart__head">
          <span className="tracker-chart__label">Projecção 6 meses · taxa de citação</span>
          <span className="tracker-chart__values">
            {pct(series[0])} → {pct(series[series.length - 1])}
          </span>
        </div>
        <Sparkline values={series} height={48} />
        <p className="tracker-chart__note">
          Projecção sigmoidal baseada em padrões observados. Não é garantia de outcome.
        </p>
      </div>
    </div>
  );
}
