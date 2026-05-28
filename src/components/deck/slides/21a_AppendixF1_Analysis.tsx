"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";

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
  // Respostas LLM reais analisadas (exclui circuit/fail/no-key). Honesto e
  // específico — substitui o antigo "Top concorrente" que mostrava um vendor
  // (Profound) como se fosse concorrente directo.
  const realResponses = deck.auditRuns.filter((r) => r.brand_present !== null).length;
  const findings_count = synth.critical_findings?.length ?? 0;

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
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 24,
          borderTop: "1px solid var(--rule-soft)",
          paddingTop: 24,
        }}
      >
        <div>
          <div className="kpi__label">Citation rate hoje</div>
          <div className="kpi__value">
            {cr_baseline != null ? `${Math.round(cr_baseline * 100)}%` : "—"}
          </div>
        </div>
        <div>
          <div className="kpi__label">Target 6 meses</div>
          <div className="kpi__value">
            {cr_target != null ? `${Math.round(cr_target * 100)}%` : "—"}
          </div>
        </div>
        <div>
          <div className="kpi__label">Respostas analisadas</div>
          <div className="kpi__value">{realResponses}</div>
        </div>
        <div>
          <div className="kpi__label">Findings críticos</div>
          <div className="kpi__value">{findings_count}</div>
        </div>
      </div>
    </SlideShell>
  );
}
