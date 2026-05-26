"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";

/**
 * Landscape competitivo: lista os concorrentes que os motores LLM
 * mencionam organicamente quando o cliente faz queries da categoria
 * — com contagem real de menções em audit_runs reais.
 */
export function AppendixFLandscape({ deck }: SlideProps) {
  const top = deck.audit?.summary?.top_competitors ?? [];

  if (top.length === 0) return null;

  // Conta menções reais (audit_runs com analysis válida) por concorrente
  // declarado no top. brand_present garante que é run real, não circuit/skip.
  const counts = top.map((name) => {
    const mentions = deck.auditRuns.filter(
      (r) => r.brand_present !== null && (r.competitors_mentioned ?? []).includes(name),
    ).length;
    return { name, mentions };
  });

  const totalReal = deck.auditRuns.filter((r) => r.brand_present !== null).length;

  return (
    <SlideShell index={19} total={26} eyebrow="Landscape · quem a IA cita">
      <h2 className="tx-h2" style={{ marginBottom: 12, maxWidth: 900 }}>
        Quem aparece quando perguntam.
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 32, maxWidth: 760 }}>
        Os motores citam estas marcas organicamente nas respostas a {totalReal} queries
        da categoria — a destaque.ai aparece 0.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
          maxWidth: 1200,
        }}
      >
        {counts.map((c, i) => {
          const share = totalReal > 0 ? Math.round((c.mentions / totalReal) * 100) : 0;
          return (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06 * i }}
              style={{
                borderTop: "2px solid var(--ink)",
                paddingTop: 12,
              }}
            >
              <div
                className="tx-h3"
                style={{
                  fontSize: 22,
                  lineHeight: 1.2,
                  marginBottom: 8,
                  fontFamily: "var(--font-fraunces), Georgia, serif",
                }}
              >
                {c.name}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontSize: 13,
                  color: "var(--ink-3)",
                }}
              >
                <span>
                  {c.mentions} {c.mentions === 1 ? "menção" : "menções"}
                </span>
                <span className="mono">{share}%</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <p
        style={{
          fontSize: 12,
          color: "var(--ink-3)",
          marginTop: 32,
          maxWidth: 760,
          fontStyle: "italic",
        }}
      >
        Contagem sobre {totalReal} respostas LLM reais (motores que devolveram resposta
        verificada — exclui rate-limited e API errors).
      </p>
    </SlideShell>
  );
}
