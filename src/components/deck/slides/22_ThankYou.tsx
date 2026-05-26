"use client";

import { motion } from "framer-motion";

export function ThankYou() {
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
          <span className="num">Fim</span>
          <span className="bar" />
          <span>Vamos a isto</span>
        </motion.div>

        <motion.h2
          className="tx-display"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ maxWidth: 940 }}
        >
          Vamos pôr a tua marca <em className="mark">no parágrafo</em>.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{
            marginTop: 48,
            display: "flex",
            gap: 32,
            alignItems: "baseline",
            color: "var(--ink-4)",
            fontSize: 14,
          }}
        >
          <a
            href="mailto:contacto@destaque.ai"
            style={{ color: "var(--paper)", textDecoration: "underline", textUnderlineOffset: 4 }}
          >
            contacto@destaque.ai
          </a>
          <span style={{ opacity: 0.5 }}>destaque.ai · Lisboa</span>
        </motion.div>
      </div>
    </div>
  );
}
