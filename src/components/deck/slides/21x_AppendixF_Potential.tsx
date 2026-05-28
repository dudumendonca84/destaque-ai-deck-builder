"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";

/**
 * Slide de potencial — fecha o ACT 2 antes de transitar para "como
 * ajudamos". Mostra o gap entre estado actual e projecção a 6 meses se
 * o plano SINAL for executado. Valores vêm de `synth.projection_6m`
 * (Routine output), não inventados.
 *
 * Sober — mostra delta em citation_rate (% e por 100 prompts). Sem €
 * para não fabricar ROI sem dados do cliente.
 */
export function AppendixFPotential({ deck }: SlideProps) {
  const synth = deck.synthesized;
  if (!synth?.projection_6m) return null;

  const { citation_rate_baseline, citation_rate_target, methodology_note_md } =
    synth.projection_6m;

  const baselinePct = Math.round((citation_rate_baseline ?? 0) * 100);
  const targetPct = Math.round((citation_rate_target ?? 0) * 100);
  const deltaPct = targetPct - baselinePct;

  // Em 100 queries de prospects da categoria, X mais a conhecerem a marca.
  const baselineQueries = Math.round((citation_rate_baseline ?? 0) * 100);
  const targetQueries = Math.round((citation_rate_target ?? 0) * 100);

  return (
    <SlideShell eyebrow="Potencial · 6 meses">
      <h2 className="tx-h2" style={{ marginBottom: 12, maxWidth: 900 }}>
        O que está em <em className="mark">cima da mesa</em>.
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 40, maxWidth: 760 }}>
        Se executarmos o plano SINAL nos próximos seis meses — projecção sobre o
        mesmo grid de prompts re-corrido com o tracker contínuo.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 48,
          alignItems: "center",
          maxWidth: 1100,
          marginBottom: 40,
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="kpi__label">Hoje</div>
          <div
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: 72,
              lineHeight: 1,
              color: "var(--ink-2)",
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            {baselinePct}%
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
            citation rate · {baselineQueries} em 100 queries
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{ fontSize: 32, color: "var(--ink-3)" }}
        >
          →
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <div className="kpi__label">Em 6 meses</div>
          <div
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: 96,
              lineHeight: 1,
              color: "var(--ink)",
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            {targetPct}%
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
            citation rate · {targetQueries} em 100 queries
          </div>
        </motion.div>
      </div>

      {synth.projection_6m.monthly_eur_estimate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: 24,
            alignItems: "center",
            maxWidth: 1100,
            marginBottom: 24,
            paddingBottom: 24,
            borderBottom: "1px solid var(--rule-soft)",
          }}
        >
          <div>
            <div className="kpi__label">Pipeline at risk · mês</div>
            <div
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 48,
                lineHeight: 1.1,
                color: "var(--ink)",
                marginTop: 4,
              }}
            >
              €{(synth.projection_6m.monthly_eur_estimate.low / 1000).toFixed(0)}–
              {(synth.projection_6m.monthly_eur_estimate.high / 1000).toFixed(0)}k
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-3)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginTop: 4,
              }}
            >
              confidence {synth.projection_6m.monthly_eur_estimate.confidence}
            </div>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.55, color: "var(--ink-3)" }}>
            <ReactMarkdown
              components={{
                p: ({ children }) => <p style={{ margin: "0 0 0.5em" }}>{children}</p>,
                strong: ({ children }) => (
                  <strong style={{ color: "var(--ink-2)" }}>{children}</strong>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--ink-2)", textDecoration: "underline" }}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {synth.projection_6m.monthly_eur_estimate.assumptions_md}
            </ReactMarkdown>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.75 }}
        style={{
          padding: 16,
          background: "var(--paper-2)",
          borderLeft: "3px solid var(--amber, #d97706)",
          maxWidth: 900,
        }}
      >
        <div
          style={{
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--amber, #d97706)",
            marginBottom: 8,
            fontWeight: 500,
          }}
        >
          +{deltaPct} pontos · meta condicional, não garantia
        </div>
        {methodology_note_md && (
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)", margin: 0 }}>
            {methodology_note_md
              .replace(/[*_`#]/g, "")
              .split(/(?<=[.!?])\s+/)
              .slice(0, 2)
              .join(" ")}
          </p>
        )}
      </motion.div>
    </SlideShell>
  );
}
