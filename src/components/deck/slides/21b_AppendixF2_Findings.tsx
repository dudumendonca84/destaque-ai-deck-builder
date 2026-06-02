"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps, DeckData } from "../types";
import { DIMENSION_LABEL } from "@/lib/skill/dimensions";

/**
 * Findings críticos — molde número-líder do v12.1.
 *
 * Princípio: cada finding tem um NÚMERO desconfortável (0 menções,
 * 25/100 score, 4 agências inventadas, 64,6% não medido). O número é o
 * herói visual; o texto é apoio. Mata a série de 8 slides iguais com
 * 55% de branco.
 *
 * Layout 2 colunas (≥large):
 *   ESQUERDA (~300px) — o número
 *     [metric_value Fraunces 84px] [metric_label caps]
 *     opcional: barra de estado (score com max) OU metric_sub (mono)
 *   DIREITA — o veredito
 *     etiqueta dimensão (canto sup direito, âmbar)
 *     title Fraunces 27px
 *     diagnóstico ≤ 3 linhas (extracto curto do why_md)
 *     fecho sobre régua: next_step.label (tinta) + next_step.text
 *
 * Fallback elegante quando metric_value não existe (audits pré-v12.1):
 * uma única coluna com o molde antigo (título + why_md completo).
 *
 * 1 finding por slide. 8 findings → 8 slides. paginated() no buildSlides.
 */
const FINDINGS_PER_PAGE = 1;

export function findingsPageCount(deck: DeckData): number {
  const n = deck.synthesized?.critical_findings?.length ?? 0;
  return n === 0 ? 0 : Math.ceil(n / FINDINGS_PER_PAGE);
}

/** Primeiras N frases do markdown, com cap de caracteres defensivo.
 * O número é o herói; o veredito é apoio em ≤3 linhas. Cap por frases
 * + cap por chars protege quando a Routine devolve frases longas. */
const DIAGNOSTIC_MAX_CHARS = 260;
function shortDiagnostic(md: string | undefined, sentences = 2): string {
  if (!md) return "";
  const plain = md.replace(/[*_`#>]/g, "").replace(/\s+/g, " ").trim();
  const parts = plain.split(/(?<=[.!?])\s+/);
  let result = parts.slice(0, sentences).join(" ").trim();
  if (result.length > DIAGNOSTIC_MAX_CHARS) {
    result = result.slice(0, DIAGNOSTIC_MAX_CHARS).replace(/\s+\S*$/, "") + "…";
  }
  return result;
}

export function AppendixF2Findings({ deck, page = 0, pageCount = 1 }: SlideProps) {
  const synth = deck.synthesized;
  if (!synth) return null;

  const all = synth.critical_findings ?? [];
  const f = all[page * FINDINGS_PER_PAGE];
  if (!f) return null;

  const hasMetric = Boolean(f.metric_value && f.metric_value.trim());
  const showBar = hasMetric && f.metric_kind === "score" && (f.metric_max ?? 0) > 0;
  const barRatio = showBar
    ? Math.min(1, Math.max(0, parseFloat(f.metric_value!) / (f.metric_max as number)))
    : 0;

  const eyebrow = `Findings críticos${pageCount > 1 ? ` · ${page + 1} de ${pageCount}` : ""}`;

  const dimLabel = DIMENSION_LABEL[f.dimension] ?? f.dimension;

  return (
    <SlideShell eyebrow={eyebrow}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: "grid",
          gridTemplateColumns: hasMetric ? "minmax(260px, 320px) 1fr" : "1fr",
          gap: hasMetric ? 56 : 0,
          alignItems: "start",
          maxWidth: 1100,
          marginTop: 8,
        }}
      >
        {/* Coluna esquerda: NÚMERO-HERÓI */}
        {hasMetric && (
          <div>
            <div
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 84,
                lineHeight: 0.9,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
              }}
            >
              {f.metric_value}
              {f.metric_kind === "score" && f.metric_max ? (
                <span style={{ fontSize: 32, color: "var(--ink-3)" }}>
                  /{f.metric_max}
                </span>
              ) : null}
            </div>
            {f.metric_label ? (
              <div
                style={{
                  marginTop: 16,
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                }}
              >
                {f.metric_label}
              </div>
            ) : null}
            {showBar ? (
              <div
                style={{
                  marginTop: 12,
                  height: 7,
                  width: "100%",
                  background: "#e4ddca",
                  borderRadius: 0,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${barRatio * 100}%`,
                    /* v12.1: findings são alertas, barra é SEMPRE amarela —
                       chama a atenção para o número desconfortável. */
                    background: "var(--accent)",
                  }}
                />
              </div>
            ) : f.metric_sub ? (
              <div
                style={{
                  marginTop: 14,
                  fontFamily: "var(--font-mono-jetbrains)",
                  fontSize: 12,
                  color: "var(--ink-3)",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {f.metric_sub}
              </div>
            ) : null}
          </div>
        )}

        {/* Coluna direita: VEREDITO */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--amber-label)",
              marginBottom: 10,
            }}
          >
            {dimLabel}
          </div>
          <h2
            className="tx-h2"
            style={{
              marginTop: 0,
              marginBottom: 16,
              maxWidth: 640,
              fontSize: 27,
              lineHeight: 1.18,
            }}
          >
            {f.title}
          </h2>

          {hasMetric ? (
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.55,
                color: "var(--ink-2)",
                maxWidth: 620,
                margin: 0,
              }}
            >
              {shortDiagnostic(f.why_md ?? f.why, 2)}
            </p>
          ) : (
            <div
              className="body-m"
              style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-2)", maxWidth: 720 }}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p style={{ margin: "0 0 0.7em" }}>{children}</p>,
                  strong: ({ children }) => (
                    <strong style={{ color: "var(--ink)" }}>{children}</strong>
                  ),
                }}
              >
                {f.why_md ?? f.why ?? ""}
              </ReactMarkdown>
            </div>
          )}

          {f.next_step ? (
            <div
              style={{
                marginTop: 24,
                paddingTop: 14,
                borderTop: "1px solid var(--rule-paper)",
                maxWidth: 620,
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 14,
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--ink)",
                  whiteSpace: "nowrap",
                }}
              >
                {f.next_step.label}
              </span>
              <span style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-3)" }}>
                {f.next_step.text}
              </span>
            </div>
          ) : null}
        </div>
      </motion.div>
    </SlideShell>
  );
}
