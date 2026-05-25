"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";
import { pct } from "@/lib/utils/format";
import { anonymizeCompetitors } from "@/lib/llm/anonymize";

export function KPIs({ deck, active }: SlideProps) {
  const s = deck.audit?.summary;
  // Concorrentes anonimizados (A, B, C...) para criar gancho comercial.
  // Revelados em call, não no deck público.
  const anonymized = anonymizeCompetitors(s?.top_competitors ?? []);
  const topCompetitorLabel = anonymized[0]?.label
    ? `Concorrente ${anonymized[0].label}`
    : "—";
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
    {
      label: "Top concorrente",
      value: topCompetitorLabel,
      note: "revelado em conversa de alinhamento",
    },
  ];
  return (
    <SlideShell index={10} total={22} eyebrow="Ponto de partida">
      <h2 className="tx-h2" style={{ marginBottom: 28 }}>
        Onde a <em className="mark">{deck.companyName}</em> está hoje
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
