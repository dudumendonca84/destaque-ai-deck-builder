"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { DeckData, SlideProps } from "../types";

const DIMS_PER_PAGE = 4;

/** 8 dimensões → 2 slides de 4. Mais respiro por dimensão e fit garantido
 * a 720px no print. */
export function methodologyPageCount(deck: DeckData): number {
  const n = deck.method.dimensions.length;
  return n <= DIMS_PER_PAGE ? 1 : Math.ceil(n / DIMS_PER_PAGE);
}

export function Methodology({ deck, active, page = 0, pageCount = 1 }: SlideProps) {
  const { sinal, dimensions } = deck.method;
  const start = page * DIMS_PER_PAGE;
  const shown = dimensions.slice(start, start + DIMS_PER_PAGE);
  const suffix = pageCount > 1 ? ` · ${page + 1}/${pageCount}` : "";

  return (
    <SlideShell eyebrow={`Metodologia · SINAL${suffix}`}>
      <h2 className="tx-h2" style={{ marginBottom: 10 }}>
        <em className="mark">SINAL</em>: o sistema que te põe na resposta.
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 28, maxWidth: 720 }}>
        {page === 0
          ? sinal
          : "Continuação — as dimensões de distribuição, prova e estratégia que sustentam a citação."}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "28px 40px",
          maxWidth: 980,
        }}
      >
        {shown.map((d, i) => (
          <motion.div
            key={d.n}
            className="bloc-rule"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: active ? 1 : 0, y: active ? 0 : 12 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono-jetbrains)",
                fontSize: "var(--fs-mono)",
                color: "var(--amber-label)",
                letterSpacing: "0.08em",
              }}
            >
              {d.n.padStart(2, "0")}
            </span>
            <span
              className="bloc-rule__hero"
              data-size="sm"
              style={{ display: "block", marginTop: 6 }}
            >
              {d.dimensao}
            </span>
            <span className="bloc-rule__context" style={{ display: "block" }}>
              {d.foco}
            </span>
          </motion.div>
        ))}
      </div>
      {page === pageCount - 1 && (
        <p style={{ marginTop: 28, fontSize: "var(--fs-mono)", color: "var(--ink-3)", opacity: 0.7 }}>
          As acções saem num plano de 4 horizontes — semana 1-2, 3-6, 7-12 e 90+ dias.
        </p>
      )}
    </SlideShell>
  );
}
