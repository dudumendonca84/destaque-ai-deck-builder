"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import type { SlideProps } from "../types";

export function Cover({ deck }: SlideProps) {
  return (
    <div className="slide" data-tone="paper">
      <div className="slide__inner slide__inner--center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Logo size={64} />
        </motion.div>

        <motion.div
          className="slide__eyebrow"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{ marginTop: 48, marginBottom: 20 }}
        >
          <span className="num">PROPOSTA</span>
          <span className="bar" />
          <span>Generative Engine Optimization</span>
        </motion.div>

        <motion.h1
          className="tx-display"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          style={{ maxWidth: 960 }}
        >
          {deck.customMessage?.trim() || (
            <>
              Proposta para <em className="mark">{deck.companyName}</em>
            </>
          )}
        </motion.h1>

        <motion.p
          className="body-m"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ marginTop: 28, color: "var(--ink-3)" }}
        >
          destaque.ai · Lisboa ·{" "}
          {new Date().toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}
        </motion.p>
      </div>
    </div>
  );
}
