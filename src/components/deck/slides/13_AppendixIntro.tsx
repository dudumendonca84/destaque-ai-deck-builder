"use client";

import { motion } from "framer-motion";

export function AppendixIntro() {
  return (
    <div className="slide" data-tone="ink">
      <div className="slide__inner slide__inner--center">
        <motion.div
          className="slide__eyebrow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 24 }}
        >
          <span className="num">Apêndices</span>
          <span className="bar" />
          <span>O detalhe de cada fase</span>
        </motion.div>
        <motion.h2
          className="tx-display"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          style={{ maxWidth: 880 }}
        >
          O <em className="mark">detalhe</em>, para quem o quer.
        </motion.h2>
        <motion.p
          className="lead"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          style={{ marginTop: 28, maxWidth: 560, color: "var(--ink-4)" }}
        >
          As próximas páginas abrem cada fase — entregáveis, duração e investimento.
        </motion.p>
      </div>
    </div>
  );
}
