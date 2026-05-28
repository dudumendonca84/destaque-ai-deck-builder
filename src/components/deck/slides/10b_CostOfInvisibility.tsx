"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";

/**
 * Converte o 0% citação numa aposta concreta — sem fabricar números de
 * pipeline do cliente. Usa apenas a estatística de categoria citada
 * (BrightEdge 82%). Aparece logo após o slide de KPIs (0%).
 */
export function CostOfInvisibility({ deck }: SlideProps) {
  const cr = deck.audit?.summary?.citation_rate ?? 0;
  const pct = Math.round(cr * 100);

  return (
    <SlideShell tone="ink" eyebrow="O custo da invisibilidade">
      <h2 className="tx-h1" style={{ maxWidth: 1000, color: "var(--paper)", marginBottom: 28 }}>
        {pct}% significa que a IA <em className="mark">nomeia outro</em>.
      </h2>
      <p
        className="lead"
        style={{ maxWidth: 760, color: "var(--ink-4)", lineHeight: 1.6 }}
      >
        Quando os teus compradores perguntam à IA pela tua categoria, a resposta
        traz nomes — e o teu não está lá. Em tech B2B,{" "}
        <strong style={{ color: "var(--paper)" }}>
          82% dessas pesquisas já acionam uma resposta de IA
        </strong>{" "}
        (BrightEdge, 2026). Cada uma é uma decisão a formar-se sem ti.
      </p>
    </SlideShell>
  );
}
