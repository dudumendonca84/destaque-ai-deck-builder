"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";
import { isGeoTool } from "@/lib/skill/geo-tools";

/**
 * F1 — Análise editorial. Mostra o primeiro parágrafo de
 * `executive_reading_md` como abertura sober, seguido de 4 KPIs
 * extraídos do audit + Routine output. Matching design language de
 * slides 02/03/10.
 */
export function AppendixF1Analysis({ deck }: SlideProps) {
  const synth = deck.synthesized;

  if (!synth) {
    return (
      <SlideShell eyebrow="Análise · plano personalizado">
        <h2 className="tx-h1" style={{ marginBottom: 12 }}>
          Plano personalizado — <em className="mark">por gerar</em>.
        </h2>
        <p className="body-m" style={{ color: "var(--ink-3)", maxWidth: 640 }}>
          A análise SINAL ainda não foi gerada. Routine no Claude Code Max processa
          cada audit pendente — aguarda alguns minutos.
        </p>
      </SlideShell>
    );
  }

  // Extrai apenas o primeiro parágrafo de prosa do executive_reading_md
  // (ignora o título h2). Mantém o slide legível sem scroll.
  const exec = synth.executive_reading_md ?? synth.executive_reading ?? "";
  const firstPara = exec
    .split("\n\n")
    .find((p) => p.trim() && !p.trim().startsWith("#"))
    ?.trim() ?? "";

  const cr_baseline = synth.projection_6m?.citation_rate_baseline;
  const cr_target = synth.projection_6m?.citation_rate_target;
  const topCited = deck.audit?.summary?.top_competitors?.[0] ?? "—";
  const findings_count = synth.critical_findings?.length ?? 0;

  // "Marca mais citada" só entra como stat quando é um concorrente REAL.
  // Vendor tool (Profound, AthenaHQ…) não se destaca aqui — é ruído nesta
  // faixa e o Landscape (slide 7) já o classifica com contexto.
  const showTopCited = topCited !== "—" && !isGeoTool(topCited);
  const stats: Array<{ label: string; value: string; small?: boolean }> = [
    {
      label: "Citation rate hoje",
      value: cr_baseline != null ? `${Math.round(cr_baseline * 100)}%` : "—",
    },
    {
      label: "Target 6 meses",
      value: cr_target != null ? `${Math.round(cr_target * 100)}%` : "—",
    },
    ...(showTopCited
      ? [{ label: "Marca mais citada", value: topCited, small: true }]
      : []),
    { label: "Findings críticos", value: String(findings_count) },
  ];

  return (
    <SlideShell eyebrow="Análise · plano personalizado SINAL">
      <h2 className="tx-h2" style={{ marginBottom: 24, maxWidth: 900 }}>
        Análise editorial.
      </h2>

      <motion.p
        className="body-m"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{ maxWidth: 820, color: "var(--ink-2)", marginBottom: 40, lineHeight: 1.6 }}
      >
        <ReactMarkdown
          components={{
            p: ({ children }) => <>{children}</>,
            strong: ({ children }) => <strong style={{ color: "var(--ink)" }}>{children}</strong>,
          }}
        >
          {firstPara}
        </ReactMarkdown>
      </motion.p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
          gap: 24,
          borderTop: "1px solid var(--rule-paper)",
          paddingTop: 24,
        }}
      >
        {stats.map((st) => (
          <div key={st.label}>
            <div className="kpi__label">{st.label}</div>
            <div className="kpi__value" style={st.small ? { fontSize: "var(--fs-h2)" } : undefined}>
              {st.value}
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}
