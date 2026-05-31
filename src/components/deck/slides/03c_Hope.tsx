"use client";

import { motion } from "framer-motion";
import type { SlideProps } from "../types";

/**
 * Slide da esperança — o destino que o método entrega. Vem logo a seguir
 * ao espelho (o 0% do cliente) para virar a tensão em aspiração. Tom
 * sóbrio, sem hype: estar na resposta, não na página 2.
 */
export function Hope(_props: SlideProps) {
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
          <span className="num">O destino</span>
          <span className="bar" />
          <span>GEO</span>
        </motion.div>

        <motion.h2
          className="tx-display"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ maxWidth: 980 }}
        >
          Imagina o <em className="mark">contrário</em>.
        </motion.h2>

        <motion.p
          className="lead"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ marginTop: 32, maxWidth: 720, color: "var(--ink-4)" }}
        >
          Um comprador pergunta à IA pela tua categoria. A resposta começa com o teu
          nome. Não pagaste por isso — foste citado porque a IA confia em ti. É isto que
          o GEO constrói: estar na resposta, não na página 2 que ninguém abre.
        </motion.p>
      </div>
    </div>
  );
}
