"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import { Counter } from "../primitives/Counter";
import type { SlideProps } from "../types";

/**
 * Parse "47%" → { num: 47, suffix: "%", text: null }
 *       "~50%" → { num: 50, suffix: "%", text: "~50%" } (mostra text como está)
 *       "1.13B" → { num: 1, suffix: ".13B", text: "1.13B" }
 * Quando há prefixos ou decimais, usa texto literal em vez de animar.
 */
function parseValue(v: string): { num: number | null; suffix: string; text: string } {
  const match = v.match(/^(\d+)(%?)$/);
  if (match) {
    return { num: parseInt(match[1], 10), suffix: match[2] ?? "", text: v };
  }
  return { num: null, suffix: "", text: v };
}

export function Data({ deck, active }: SlideProps) {
  // Mostra até 3 benchmarks. Se vier vazio, esconde o slide via fallback.
  const items = deck.benchmarks.slice(0, 3);

  if (items.length === 0) {
    return (
      <SlideShell index={3} total={18} eyebrow="O contexto">
        <h2 className="tx-h2" style={{ maxWidth: 720, marginBottom: 36 }}>
          Não é uma tendência. É <em className="mark">já</em>.
        </h2>
        <p className="body-m" style={{ color: "var(--ink-3)" }}>
          Dados em actualização. Estamos a verificar fontes primárias antes de publicar
          números neste slide.
        </p>
      </SlideShell>
    );
  }

  return (
    <SlideShell index={3} total={18} eyebrow="O contexto">
      <h2 className="tx-h2" style={{ maxWidth: 720, marginBottom: 36 }}>
        Não é uma tendência. É <em className="mark">já</em>.
      </h2>
      <div className="data-grid">
        {items.map((b, i) => {
          const parsed = parseValue(b.value);
          return (
            <motion.div
              className="data-stat"
              key={b.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: active ? 1 : 0, y: active ? 0 : 16 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.12 }}
            >
              <span className="data-stat__value">
                {parsed.num !== null && b.value === `${parsed.num}${parsed.suffix}` ? (
                  <Counter to={parsed.num} active={active} suffix={parsed.suffix} />
                ) : (
                  parsed.text
                )}
              </span>
              <span className="data-stat__label">{b.caption}</span>
              <a
                href={b.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="data-stat__source"
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "var(--ink-3)",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                {b.source_name}
              </a>
            </motion.div>
          );
        })}
      </div>
    </SlideShell>
  );
}
