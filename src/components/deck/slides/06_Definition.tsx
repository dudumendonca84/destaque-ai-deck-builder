"use client";

import { motion } from "framer-motion";

export function Definition() {
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
          <span className="num">02</span>
          <span className="bar" />
          <span>A definição</span>
        </motion.div>

        <motion.div
          className="geo-block"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.6, 0.05, 0.2, 1] }}
        >
          GEO
        </motion.div>

        <motion.p
          className="lead"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          style={{ marginTop: 32, maxWidth: 680, color: "var(--ink-4)" }}
        >
          <b style={{ color: "var(--paper)" }}>Generative Engine Optimization</b> — o
          conjunto de práticas técnicas e editoriais que torna uma marca{" "}
          <em className="mark">citável</em> pelos modelos de IA generativa.
        </motion.p>
      </div>
    </div>
  );
}
