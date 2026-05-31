"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps, DeckData } from "../types";

// 1 por página: cada finding é um argumento e merece o slide inteiro —
// título grande, why completo, benchmark em destaque. Mais findings →
// mais slides (paginação no buildSlides).
const FINDINGS_PER_PAGE = 1;

/** Nº de slides Findings necessários para mostrar todos os findings. */
export function findingsPageCount(deck: DeckData): number {
  const n = deck.synthesized?.critical_findings?.length ?? 0;
  return n === 0 ? 0 : Math.ceil(n / FINDINGS_PER_PAGE);
}

import { DIMENSION_LABEL } from "@/lib/skill/dimensions";

export function AppendixF2Findings({ deck, page = 0, pageCount = 1 }: SlideProps) {
  const synth = deck.synthesized;
  if (!synth) return null;

  // Paginação: 4 findings por slide. why_md completo (sem truncar).
  const all = synth.critical_findings ?? [];
  const start = page * FINDINGS_PER_PAGE;
  const findings = all.slice(start, start + FINDINGS_PER_PAGE);

  return (
    <SlideShell
      eyebrow={`Findings críticos${pageCount > 1 ? ` · ${page + 1} de ${pageCount}` : ""}`}
    >
      {findings.map((f) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ maxWidth: 940 }}
        >
          <span
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--amber, #d97706)",
              fontWeight: 500,
            }}
          >
            {DIMENSION_LABEL[f.dimension] ?? f.dimension}
          </span>
          <h2
            className="tx-h2"
            style={{ marginTop: 10, marginBottom: 20, maxWidth: 900 }}
          >
            {f.title}
          </h2>
          <div
            className="body-m"
            style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink-2)", maxWidth: 820 }}
          >
            <ReactMarkdown
              components={{
                p: ({ children }) => <p style={{ margin: "0 0 0.9em" }}>{children}</p>,
                strong: ({ children }) => <strong style={{ color: "var(--ink)" }}>{children}</strong>,
              }}
            >
              {f.why_md ?? f.why ?? ""}
            </ReactMarkdown>
          </div>
          {f.benchmark_md && (
            <div
              style={{
                marginTop: 24,
                padding: "12px 16px",
                fontSize: 14,
                color: "var(--ink-2)",
                background: "var(--paper-2)",
                borderLeft: "3px solid var(--amber, #d97706)",
                maxWidth: 820,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--amber, #d97706)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Benchmark
              </span>
              {(f.benchmark_md ?? "")
                .replace(/[*_`#]/g, "")
                .replace(/3HASH[\s-]*grade/gi, "benchmark")
                .replace(/^\s*benchmark[:\s]*/i, "")}
            </div>
          )}
        </motion.div>
      ))}
    </SlideShell>
  );
}
