"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";

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

export function AppendixF3ActionH1({ deck }: SlideProps) {
  const synth = deck.synthesized;
  if (!synth) return null;

  // H1 tipicamente tem 5-7 acções; mostra as primeiras 6 em grid compacto.
  const actions = (synth.action_plan?.h1 ?? []).slice(0, 6);

  return (
    <SlideShell index={20} total={26} eyebrow="Plano · H1 semana 1-2">
      <h2 className="tx-h2" style={{ marginBottom: 32, maxWidth: 900 }}>
        O que acontece <em className="mark">primeiro</em>.
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 20,
          maxWidth: 1080,
        }}
      >
        {actions.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.04 * i }}
            style={{
              borderLeft: "2px solid var(--rule-soft)",
              paddingLeft: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--amber, #d97706)",
                  fontWeight: 500,
                }}
              >
                {DIMENSION_LABEL[a.dimension] ?? a.dimension}
              </span>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{a.effort}</span>
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.4, color: "var(--ink)" }}>
              {a.title}
            </div>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
