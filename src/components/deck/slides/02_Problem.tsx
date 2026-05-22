"use client";

import { motion } from "framer-motion";

export function Problem() {
  return (
    <div className="slide" data-tone="ink">
      <div className="slide__inner slide__inner--center">
        <motion.div
          className="slide__eyebrow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 28 }}
        >
          <span className="num">01</span>
          <span className="bar" />
          <span>O problema</span>
        </motion.div>

        <motion.h2
          className="tx-display"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ maxWidth: 980 }}
        >
          A pesquisa mudou de <em className="mark">sítio</em>.
        </motion.h2>

        <motion.p
          className="lead"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ marginTop: 32, maxWidth: 620, color: "var(--ink-4)" }}
        >
          Os teus clientes deixaram de escrever no Google. Perguntam ao ChatGPT, ao
          Claude, ao Gemini. E a IA responde — com nomes, com recomendações, com uma
          decisão quase tomada.
        </motion.p>
      </div>
    </div>
  );
}
