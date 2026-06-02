"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";

/**
 * Slide da prova própria — o momento de viragem do deck. Deixa de citar
 * estudos US-EN e apresenta evidência primária PT: 60% do SaaS B2B
 * português não é recomendado por nenhum assistente de IA. Fecha com a
 * pergunta-gancho "Estás nos 40%, ou nos 60%?".
 *
 * Estudo: 45 empresas, 3 motores (Claude, Gemini, Grok), Maio 2026.
 */
const STUDY_URL = "https://destaque.ai/estudo/visibilidade-ia-saas-portugal-2026";

// Achado fixo do estudo destaque.ai, Maio 2026 — não derivado de
// audit/motores. Constante para impedir drift entre prospects e
// builds. Se a metodologia mudar, mexer aqui (sítio único).
const STUDY_HEADLINE_PCT = 60;

export function OurStudy({ active }: SlideProps) {
  return (
    <SlideShell eyebrow="A prova">
      <h2 className="tx-h2" style={{ maxWidth: 760, marginBottom: 20 }}>
        Não é teoria. Fizemos o <em className="mark">estudo</em>.
      </h2>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 16 }}
        transition={{ duration: 0.55, delay: 0.15 }}
        style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 820 }}
      >
        <div
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: "var(--fs-display-1)",
            lineHeight: 1,
            letterSpacing: -3,
            color: "var(--ink)",
          }}
        >
          {STUDY_HEADLINE_PCT}
          <em className="mark" style={{ fontSize: "var(--fs-display-1)" }}>
            %
          </em>
        </div>

        <p className="body-m" style={{ color: "var(--ink-2)", maxWidth: 720 }}>
          Auditámos 45 SaaS B2B portuguesas em 4 motores de IA.{" "}
          <strong>60% não é recomendada por nenhum.</strong> 31% é completamente
          invisível — a IA nem as nomeia.
        </p>

        <p
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: "var(--fs-h2)",
            color: "var(--ink)",
          }}
        >
          Estás nos 40%, ou nos <em className="mark">60%</em>?
        </p>

        <p style={{ fontSize: "var(--fs-mono)", color: "var(--ink-3)" }}>
          Fonte:{" "}
          <a
            href={STUDY_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--ink-3)", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Estudo destaque.ai, 2026
          </a>
          .
        </p>
      </motion.div>
    </SlideShell>
  );
}
