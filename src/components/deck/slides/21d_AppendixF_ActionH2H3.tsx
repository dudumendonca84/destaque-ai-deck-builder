"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";
import type { ActionItem } from "@/lib/llm/synthesize-deck";

const DIMENSION_LABEL: Record<string, string> = {
  technical: "Técnica",
  content: "Conteúdo",
  entity: "Entidade",
  authority: "Autoridade",
  ux: "UX",
  measurement: "Medição",
  positioning: "Posicionamento",
  operational: "Operacional",
};

function ActionRow({ action, delay }: { action: ActionItem; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      style={{
        borderTop: "1px solid var(--rule-soft)",
        padding: "10px 0",
        display: "grid",
        gridTemplateColumns: "100px 1fr 80px",
        gap: 16,
        alignItems: "baseline",
      }}
    >
      <span
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--amber, #d97706)",
          fontWeight: 500,
        }}
      >
        {DIMENSION_LABEL[action.dimension] ?? action.dimension}
      </span>
      <span style={{ fontSize: 14, lineHeight: 1.4, color: "var(--ink)" }}>
        {action.title}
      </span>
      <span style={{ fontSize: 11, color: "var(--ink-3)", textAlign: "right" }}>
        {action.effort}
      </span>
    </motion.div>
  );
}

export function AppendixFActionH2H3({ deck }: SlideProps) {
  const synth = deck.synthesized;
  if (!synth) return null;

  const h2 = synth.action_plan?.h2 ?? [];
  const h3 = synth.action_plan?.h3 ?? [];
  const ongoing = synth.action_plan?.ongoing ?? [];

  return (
    <SlideShell index={21} total={26} eyebrow="Plano · H2 · H3 · contínuo">
      <h2 className="tx-h2" style={{ marginBottom: 24, maxWidth: 900 }}>
        Onde se chega.
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        <div>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--ink-3)",
              marginBottom: 8,
            }}
          >
            H2 · semana 3-8
          </div>
          {h2.slice(0, 5).map((a, i) => (
            <ActionRow key={`h2-${i}`} action={a} delay={0.05 * i} />
          ))}
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--ink-3)",
              marginBottom: 8,
            }}
          >
            H3 · mês 2-6
          </div>
          {h3.slice(0, 5).map((a, i) => (
            <ActionRow key={`h3-${i}`} action={a} delay={0.05 * i} />
          ))}
          {ongoing.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--ink-3)",
                  marginTop: 20,
                  marginBottom: 8,
                }}
              >
                Contínuo
              </div>
              {ongoing.slice(0, 3).map((a, i) => (
                <ActionRow key={`og-${i}`} action={a} delay={0.05 * i} />
              ))}
            </>
          )}
        </div>
      </div>
    </SlideShell>
  );
}
