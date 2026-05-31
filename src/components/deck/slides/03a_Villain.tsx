"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";

/**
 * Slide do vilão concreto. Cria tensão antes da prova própria: a IA já
 * responde com nomes, e hoje são os concorrentes. Os nomes
 * (Stripe/Cloudbeds/UpKeep) vêm do nosso estudo real de 45 SaaS B2B PT.
 */
const VILLAINS: Array<[string, string]> = [
  ["Pagamentos", "Stripe"],
  ["Hotelaria", "Cloudbeds"],
  ["Indústria", "UpKeep"],
];

export function Villain({ active }: SlideProps) {
  return (
    <SlideShell eyebrow="Quem aparece">
      <h2 className="tx-h2" style={{ marginBottom: 16 }}>
        E o nome não é o <em className="mark">teu</em>.
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", maxWidth: 760, marginBottom: 32 }}>
        Agora mesmo, um comprador pergunta à IA pela tua categoria. A resposta traz três
        nomes — e hoje são os teus concorrentes.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "24px 40px",
          maxWidth: 820,
        }}
      >
        {VILLAINS.map(([cat, name], i) => (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: active ? 1 : 0, y: active ? 0 : 14 }}
            transition={{ duration: 0.45, delay: 0.15 + i * 0.12 }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "var(--ink-3)",
              }}
            >
              {cat}
            </div>
            <div
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: "clamp(26px, 5vw, 40px)",
                lineHeight: 1.1,
                color: "var(--ink)",
                marginTop: 6,
              }}
            >
              {name}
            </div>
          </motion.div>
        ))}
      </div>
      <p
        style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontSize: 20,
          color: "var(--ink)",
          marginTop: 34,
        }}
      >
        A marca portuguesa ficava de fora.
      </p>
      <p style={{ marginTop: 14, fontSize: 12, color: "var(--ink-4)" }}>
        Estudo destaque.ai, 2026 — 45 SaaS B2B portuguesas, 3 motores de IA.
      </p>
    </SlideShell>
  );
}
