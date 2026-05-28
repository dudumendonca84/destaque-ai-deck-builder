"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps, DeckData } from "../types";

const FAQ_PER_PAGE = 3;

/** Nº de slides FAQ. Paginado a 3/slide (coluna única, respira). */
export function faqPageCount(deck: DeckData): number {
  const n = deck.synthesized?.faq?.length ?? 0;
  return n === 0 ? 0 : Math.ceil(n / FAQ_PER_PAGE);
}

export function AppendixFFAQ({ deck, page = 0, pageCount = 1 }: SlideProps) {
  const synth = deck.synthesized;
  if (!synth || (synth.faq ?? []).length === 0) return null;

  const all = synth.faq ?? [];
  const start = page * FAQ_PER_PAGE;
  const faqs = all.slice(start, start + FAQ_PER_PAGE);

  return (
    <SlideShell
      eyebrow={`Perguntas frequentes${pageCount > 1 ? ` · ${page + 1} de ${pageCount}` : ""}`}
    >
      <h2 className="tx-h2" style={{ marginBottom: 32, maxWidth: 900 }}>
        Perguntas que <em className="mark">aparecem</em>.
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 880 }}>
        {faqs.map((qa, i) => {
          const ans = (qa.a_md ?? qa.a ?? "")
            .split(/(?<=[.!?])\s+/)
            .slice(0, 3)
            .join(" ");
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06 * i }}
              style={{ borderTop: "1px solid var(--rule-soft)", paddingTop: 16 }}
            >
              <h3 className="tx-h3" style={{ fontSize: 20, marginBottom: 10, lineHeight: 1.3 }}>
                {qa.q}
              </h3>
              <div style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-3)" }}>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <>{children}</>,
                    strong: ({ children }) => (
                      <strong style={{ color: "var(--ink-2)" }}>{children}</strong>
                    ),
                  }}
                >
                  {ans}
                </ReactMarkdown>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SlideShell>
  );
}
