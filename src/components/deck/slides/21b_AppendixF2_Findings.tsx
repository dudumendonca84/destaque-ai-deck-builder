"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps, DeckData } from "../types";

// 2 por página: why_md tem 100-200 palavras, precisa de meia-largura
// a altura completa para caber sem scroll. Mais findings → mais slides.
const FINDINGS_PER_PAGE = 2;

/** Nº de slides Findings necessários para mostrar todos os findings. */
export function findingsPageCount(deck: DeckData): number {
  const n = deck.synthesized?.critical_findings?.length ?? 0;
  return n === 0 ? 0 : Math.ceil(n / FINDINGS_PER_PAGE);
}

const DIMENSION_LABEL: Record<string, string> = {
  technical: "Técnica",
  content: "Conteúdo",
  entity: "Entidade",
  authority: "Autoridade",
  ux: "UX",
  measurement: "Medição",
  positioning: "Posicionamento",
  operational: "Operacional",
};

export function AppendixF2Findings({ deck, page = 0, pageCount = 1 }: SlideProps) {
  const synth = deck.synthesized;
  if (!synth) return null;

  // Paginação: 4 findings por slide. why_md completo (sem truncar).
  const all = synth.critical_findings ?? [];
  const start = page * FINDINGS_PER_PAGE;
  const findings = all.slice(start, start + FINDINGS_PER_PAGE);

  return (
    <SlideShell
      index={19}
      total={26}
      eyebrow={`Análise · findings críticos${pageCount > 1 ? ` ${page + 1}/${pageCount}` : ""}`}
    >
      <h2 className="tx-h2" style={{ marginBottom: 24, maxWidth: 900 }}>
        Onde está o problema.
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 24,
          maxWidth: 1100,
        }}
      >
        {findings.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 * i }}
            style={{
              borderTop: "1px solid var(--rule-soft)",
              paddingTop: 12,
            }}
          >
            <span
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--amber, #d97706)",
                fontWeight: 500,
              }}
            >
              {DIMENSION_LABEL[f.dimension] ?? f.dimension}
            </span>
            <h3
              className="tx-h3"
              style={{ marginTop: 6, marginBottom: 10, fontSize: 18, lineHeight: 1.3 }}
            >
              {f.title}
            </h3>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: "var(--ink-3)",
              }}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p style={{ margin: "0 0 0.6em" }}>{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ color: "var(--ink-2)" }}>{children}</strong>
                  ),
                }}
              >
                {f.why_md ?? f.why ?? ""}
              </ReactMarkdown>
            </div>
            {f.benchmark_md && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: "var(--ink-2)",
                  fontFamily: "var(--font-mono-jetbrains)",
                  borderLeft: "2px solid var(--amber, #d97706)",
                  paddingLeft: 8,
                }}
              >
                {f.benchmark_md.replace(/[*_`#]/g, "").replace(/3HASH[\s-]*grade/gi, "benchmark")}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
