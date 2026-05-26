"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";

export function AppendixFFAQ({ deck }: SlideProps) {
  const synth = deck.synthesized;
  if (!synth || (synth.faq ?? []).length === 0) return null;

  // Mostra até 4 FAQs (cabem em 2x2 confortavelmente). Cada resposta
  // limitada às primeiras ~2 frases para não criar scroll.
  const faqs = (synth.faq ?? []).slice(0, 4);

  return (
    <SlideShell index={22} total={26} eyebrow="Análise · perguntas frequentes">
      <h2 className="tx-h2" style={{ marginBottom: 32, maxWidth: 900 }}>
        Perguntas que <em className="mark">aparecem</em>.
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 32,
          maxWidth: 1100,
        }}
      >
        {faqs.map((qa, i) => {
          const ans = qa.a_md ?? qa.a ?? "";
          // Limita a 2 frases para evitar scroll
          const condensed =
            ans
              .split(/(?<=[.!?])\s+/)
              .slice(0, 2)
              .join(" ") ?? "";
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06 * i }}
              style={{ borderTop: "1px solid var(--rule-soft)", paddingTop: 14 }}
            >
              <h3
                className="tx-h3"
                style={{ fontSize: 18, marginBottom: 10, lineHeight: 1.3 }}
              >
                {qa.q}
              </h3>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--ink-3)" }}>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <>{children}</>,
                    strong: ({ children }) => (
                      <strong style={{ color: "var(--ink-2)" }}>{children}</strong>
                    ),
                  }}
                >
                  {condensed}
                </ReactMarkdown>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SlideShell>
  );
}
