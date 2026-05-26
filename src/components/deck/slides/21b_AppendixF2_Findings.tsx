"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";

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

export function AppendixF2Findings({ deck }: SlideProps) {
  const synth = deck.synthesized;
  if (!synth) return null;

  // Mostra os primeiros 6 findings (cabem confortavelmente em 2 colunas).
  // Cada finding tem só dimension + title + why_md condensado.
  const findings = (synth.critical_findings ?? []).slice(0, 6);

  return (
    <SlideShell index={19} total={26} eyebrow="Análise · findings críticos">
      <h2 className="tx-h2" style={{ marginBottom: 32, maxWidth: 900 }}>
        Onde está o problema.
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 24,
          maxWidth: 1080,
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
              style={{ marginTop: 6, marginBottom: 10, fontSize: 19, lineHeight: 1.3 }}
            >
              {f.title}
            </h3>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: "var(--ink-3)",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => <>{children}</>,
                  strong: ({ children }) => (
                    <strong style={{ color: "var(--ink-2)" }}>{children}</strong>
                  ),
                }}
              >
                {(f.why_md ?? f.why ?? "").split("\n\n")[0] ?? ""}
              </ReactMarkdown>
            </div>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
