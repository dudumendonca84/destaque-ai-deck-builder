"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";
import { pct } from "@/lib/utils/format";

/**
 * Lista de plataformas conhecidas de tracking/medição GEO. Quando a marca
 * mais citada na categoria é uma destas, o card muda o label para
 * "Ferramenta de referência citada" — evita apresentar uma ferramenta
 * como se fosse consultora concorrente.
 */
const GEO_TOOLS = [
  "profound",
  "otterly.ai",
  "otterly",
  "peec ai",
  "peec.ai",
  "athenahq",
  "athena hq",
  "brightedge",
  "conductor",
  "semrush",
  "ahrefs",
  "kalicube",
  "searchmetrics",
];

function isGeoTool(brand: string): boolean {
  const norm = brand.trim().toLowerCase();
  return GEO_TOOLS.some((t) => norm === t || norm.startsWith(`${t} `));
}

export function KPIs({ deck, active }: SlideProps) {
  const s = deck.audit?.summary;
  const topCited = s?.top_competitors?.[0] ?? "—";
  const topIsTool = topCited !== "—" && isGeoTool(topCited);
  const cards = [
    { label: "Taxa de citação", value: s ? pct(s.citation_rate) : "—", note: "respostas onde és citado" },
    {
      label: "Share of voice",
      value: s ? pct(s.share_of_voice) : "—",
      note: "a tua fatia das menções dentro das respostas onde apareces",
    },
    {
      label: "Posição média",
      value: s?.avg_position != null ? `#${s.avg_position}` : "—",
      note: "ordem em que apareces",
    },
    topIsTool
      ? {
          label: "Ferramenta de referência citada",
          value: topCited,
          note: "plataforma de medição GEO — não consultora concorrente",
        }
      : {
          label: "Marca mais citada na categoria",
          value: topCited,
          note: "quem a IA nomeia hoje — não um concorrente directo",
        },
  ];
  return (
    <SlideShell eyebrow="Ponto de partida">
      <h2 className="tx-h2" style={{ marginBottom: 28 }}>
        Onde a <em className="mark">destaque.ai</em> está hoje
      </h2>
      <div className="kpi-grid">
        {cards.map((c, i) => (
          <motion.div
            className="kpi-card"
            key={c.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: active ? 1 : 0, y: active ? 0 : 14 }}
            transition={{ duration: 0.45, delay: 0.12 + i * 0.1 }}
          >
            <span className="kpi-card__label">{c.label}</span>
            <span className="kpi-card__value">{c.value}</span>
            <span className="kpi-card__note">{c.note}</span>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
