"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import { ENGINE_COUNT } from "@/lib/llm/models";
import type { SlideProps } from "../types";

const PILLARS = [
  {
    n: "01",
    t: "Auditoria",
    d: `Medimos a tua visibilidade real em ${ENGINE_COUNT} motores de IA.`,
  },
  { n: "02", t: "Conteúdo", d: "Tornamos a tua marca extraível e citável pela IA." },
  { n: "03", t: "Distribuição", d: "Construímos autoridade onde os modelos vão buscar." },
  { n: "04", t: "Medição", d: "Monitorizamos e iteramos com dados, todos os meses." },
];

export function Methodology({ active }: SlideProps) {
  return (
    <SlideShell index={7} total={21} eyebrow="Metodologia">
      <h2 className="tx-h2" style={{ marginBottom: 28 }}>
        Quatro disciplinas, <em className="mark">um sistema</em>
      </h2>
      <div className="method-grid">
        {PILLARS.map((p, i) => (
          <motion.div
            className="method-card"
            key={p.n}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: active ? 1 : 0, y: active ? 0 : 14 }}
            transition={{ duration: 0.45, delay: 0.12 + i * 0.1 }}
          >
            <span className="method-card__n">{p.n}</span>
            <span className="method-card__t">{p.t}</span>
            <span className="method-card__d">{p.d}</span>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
