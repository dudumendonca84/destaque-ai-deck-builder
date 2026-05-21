"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import { Counter } from "../primitives/Counter";
import type { SlideProps } from "../types";

const STATS = [
  { to: 13, label: "da pesquisa global já passa por motores de IA — e a subir todos os meses." },
  { to: 40, label: "dos utilizadores confiam na resposta da IA sem clicar em nenhum link." },
  { to: 70, label: "das decisões B2B começam hoje com investigação assistida por IA." },
];

export function Data({ active }: SlideProps) {
  return (
    <SlideShell index={3} total={18} eyebrow="O contexto">
      <h2 className="tx-h2" style={{ maxWidth: 720, marginBottom: 36 }}>
        Não é uma tendência. É <em className="mark">já</em>.
      </h2>
      <div className="data-grid">
        {STATS.map((s, i) => (
          <motion.div
            className="data-stat"
            key={s.to}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: active ? 1 : 0, y: active ? 0 : 16 }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.12 }}
          >
            <span className="data-stat__value">
              <Counter to={s.to} active={active} suffix="%" />
            </span>
            <span className="data-stat__label">{s.label}</span>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
