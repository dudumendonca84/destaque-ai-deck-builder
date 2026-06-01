"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";

/**
 * Investimento — sistema "blocos sobre régua" do v12.
 *
 * Spec v12: herói = duração (não preço). "Investimento · sob consulta" no
 * rodapé igual nos três (constraint v12: sem preços hardcoded — mantém
 * "sob consulta" para já). Destaque do Sprint = régua preta + etiqueta a
 * tinta (NÃO retângulo amarelo cheio que apaga os vizinhos).
 */

type Tier = {
  name: string;
  duration: string;
  unit: string;
  includes: string[];
  featured?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Diagnóstico",
    duration: "2 semanas",
    unit: "ponto único",
    includes: ["Auditoria GEO", "Benchmark competitivo", "Roadmap priorizado"],
  },
  {
    name: "Sprint",
    duration: "4–6 semanas",
    unit: "implementação",
    includes: [
      "Entidade + higiene técnica",
      "Páginas-resposta",
      "Sinais de autoridade",
    ],
    featured: true,
  },
  {
    name: "Retainer",
    duration: "Mensal",
    unit: "contínuo",
    includes: [
      "Tracking de citações",
      "Iteração à medida que os modelos evoluem",
      "Relatório consolidado",
    ],
  },
];

export function Pricing({ active }: SlideProps) {
  return (
    <SlideShell eyebrow="Investimento">
      <h2 className="tx-h2" style={{ marginBottom: 8, maxWidth: 820 }}>
        Três fases, <em className="mark">um percurso claro</em>.
      </h2>
      <p
        className="body-m"
        style={{ color: "var(--ink-3)", marginBottom: 36, maxWidth: 760 }}
      >
        As fases são sequenciais — podes parar no fim de qualquer uma.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 32,
          maxWidth: 1040,
          marginBottom: 36,
        }}
      >
        {TIERS.map((t, i) => (
          <motion.div
            key={t.name}
            className="bloc-rule"
            data-rule="grouped"
            data-emphasis={t.featured ? "strong" : undefined}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: active ? 1 : 0, y: active ? 0 : 12 }}
            transition={{ duration: 0.45, delay: 0.1 + i * 0.08 }}
          >
            <span className="bloc-rule__label">{t.name}</span>
            <span className="bloc-rule__hero" data-size="md">
              {t.duration}
            </span>
            <span
              className="bloc-rule__context"
              style={{ marginTop: 4, fontStyle: "italic" }}
            >
              {t.unit}
            </span>
            <ul
              style={{
                marginTop: 14,
                paddingLeft: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {t.includes.map((line) => (
                <li
                  key={line}
                  style={{
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: "var(--ink-2)",
                  }}
                >
                  {line}
                </li>
              ))}
            </ul>
            <p
              style={{
                marginTop: 18,
                fontSize: 12,
                color: "var(--ink-3)",
                fontFamily: "var(--font-mono-jetbrains)",
                letterSpacing: 0.5,
              }}
            >
              Investimento · sob consulta
            </p>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
