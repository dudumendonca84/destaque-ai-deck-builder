"use client";

import { SlideShell } from "../primitives/SlideShell";
import { findBenchmark } from "@/lib/skill/benchmarks";
import type { SlideProps } from "../types";

/**
 * Converte o 0% citação numa aposta concreta — sem fabricar números de
 * pipeline do cliente. A estatística de categoria (B2B já aciona resposta
 * de IA) vem viva da skill (`b2b_ai_answer`). Aparece logo após o slide de
 * KPIs (0%).
 */
export function CostOfInvisibility({ deck }: SlideProps) {
  const cr = deck.audit?.summary?.citation_rate ?? 0;
  const pct = Math.round(cr * 100);
  const b2b = findBenchmark(deck.benchmarks, "b2b_ai_answer");

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
        traz nomes — e o teu não está lá.{" "}
        {b2b ? (
          <>
            <strong style={{ color: "var(--paper)" }}>
              {b2b.value} {b2b.caption}
            </strong>{" "}
            <a
              href={b2b.source_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--ink-4)", textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              {b2b.source_name}
            </a>
            . Cada uma é uma decisão a formar-se sem ti.
          </>
        ) : (
          "Cada uma é uma decisão a formar-se sem ti."
        )}
      </p>
    </SlideShell>
  );
}
