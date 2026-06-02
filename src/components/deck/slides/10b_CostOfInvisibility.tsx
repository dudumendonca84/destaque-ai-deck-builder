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
  // 2º elemento: a projecção 6m só aparece quando a Routine a produziu
  // (synth.projection_6m). Pareia o número desconfortável com o que ele
  // pode ser — não inventa, não promete.
  const target = deck.synthesized?.projection_6m?.citation_rate_target;
  const targetPct = target != null ? Math.round(target * 100) : null;

  return (
    <SlideShell tone="ink" eyebrow="O custo da invisibilidade">
      <h2 className="tx-h1" style={{ maxWidth: 1000, color: "var(--paper)", marginBottom: 28 }}>
        {pct}% significa que a IA <em className="mark">nomeia outro</em>.
      </h2>

      {targetPct != null && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 18,
            marginBottom: 32,
            color: "var(--ink-4)",
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: "var(--fs-h2)",
            lineHeight: 1.2,
          }}
        >
          <span style={{ color: "var(--paper)" }}>{pct}% hoje</span>
          <span style={{ opacity: 0.6 }}>→</span>
          <span style={{ color: "var(--accent)" }}>{targetPct}% em 6 meses</span>
          <span
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "var(--fs-mono)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-4)",
              opacity: 0.7,
            }}
          >
            meta condicional · plano SINAL
          </span>
        </div>
      )}
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
