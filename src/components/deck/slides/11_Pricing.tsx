"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";
import { eur } from "@/lib/utils/format";

export function Pricing({ deck, active }: SlideProps) {
  const tiers = [
    {
      name: "Diagnóstico",
      price: eur(deck.pricing.diagnostico),
      unit: "one-off",
      d: "Auditoria GEO completa e roadmap priorizado.",
    },
    {
      name: "Sprint",
      price: eur(deck.pricing.sprint),
      unit: "one-off",
      d: "Implementação técnica e editorial do roadmap.",
      featured: true,
    },
    {
      name: "Retainer",
      price: eur(deck.pricing.retainer),
      unit: "/ mês",
      d: "Distribuição, monitorização e iteração contínuas.",
    },
  ];
  return (
    <SlideShell index={11} total={18} eyebrow="Investimento">
      <h2 className="tx-h2" style={{ marginBottom: 28 }}>
        Três fases, <em className="mark">um número claro</em>
      </h2>
      <div className="pricing-grid">
        {tiers.map((t, i) => (
          <motion.div
            className={`pricing-card${t.featured ? " is-featured" : ""}`}
            key={t.name}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: active ? 1 : 0, y: active ? 0 : 14 }}
            transition={{ duration: 0.45, delay: 0.12 + i * 0.1 }}
          >
            <span className="pricing-card__name">{t.name}</span>
            <span className="pricing-card__price">{t.price}</span>
            <span className="pricing-card__unit">{t.unit}</span>
            <span className="pricing-card__d">{t.d}</span>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
