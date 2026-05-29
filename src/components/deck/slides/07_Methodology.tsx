"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";

export function Methodology({ deck, active }: SlideProps) {
  const { sinal, dimensions } = deck.method;

  return (
    <SlideShell eyebrow="Metodologia · SINAL">
      <h2 className="tx-h2" style={{ marginBottom: 10 }}>
        <em className="mark">SINAL</em>: oito dimensões, um sistema.
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 24, maxWidth: 720 }}>
        {sinal}
      </p>
      <div className="dim-grid">
        {dimensions.map((d, i) => (
          <motion.div
            className="dim-card"
            key={d.n}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: active ? 1 : 0, y: active ? 0 : 12 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
          >
            <span className="dim-card__n">{d.n.padStart(2, "0")}</span>
            <span className="dim-card__t">{d.dimensao}</span>
            <span className="dim-card__d">{d.foco}</span>
          </motion.div>
        ))}
      </div>
      <p style={{ marginTop: 22, fontSize: 12, color: "var(--ink-3)", opacity: 0.7 }}>
        As acções saem num plano de 4 horizontes — semana 1-2, 3-6, 7-12 e 90+ dias.
      </p>
    </SlideShell>
  );
}
