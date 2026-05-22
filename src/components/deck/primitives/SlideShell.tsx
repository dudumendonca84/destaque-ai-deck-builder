"use client";

import { motion } from "framer-motion";

type Props = {
  index: number;
  total: number;
  eyebrow: string;
  tone?: "paper" | "ink";
  children: React.ReactNode;
};

/** Moldura comum de slide: numeração mono no topo, animação de entrada sóbria. */
export function SlideShell({ index, total, eyebrow, tone = "paper", children }: Props) {
  return (
    <div className="slide" data-tone={tone}>
      <div className="slide__inner">
        <motion.div
          className="slide__eyebrow"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="num">
            {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <span className="bar" />
          <span>{eyebrow}</span>
        </motion.div>
        <motion.div
          className="slide__body"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
