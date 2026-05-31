"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import { Counter } from "../primitives/Counter";
import type { SlideProps } from "../types";

/**
 * Slide 03b — o nosso próprio estudo. Insere-se logo a seguir aos
 * benchmarks externos (slide 03) para virar a narrativa: deixamos de
 * citar estudos US-EN e passamos a apresentar evidência primária PT.
 *
 * Número-herói: 60% do SaaS B2B português não é recomendado por nenhum
 * assistente de IA na sua categoria. Auditoria de 45 empresas em 3
 * motores (Claude, Gemini, Grok) em Maio 2026.
 */
export function OurStudy({ active }: SlideProps) {
  return (
    <SlideShell eyebrow="Estudo destaque.ai · 2026">
      <h2 className="tx-h2" style={{ maxWidth: 720, marginBottom: 32 }}>
        Fizemos <em className="mark">o estudo</em>.
      </h2>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 16 }}
        transition={{ duration: 0.55, delay: 0.15 }}
        style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 820 }}
      >
        <div className="data-stat">
          <span className="data-stat__value">
            <Counter to={60} active={active} suffix="%" />
          </span>
          <span className="data-stat__label">
            do SaaS B2B português não é recomendado por nenhum assistente de IA na sua categoria
          </span>
        </div>

        <p className="body-m" style={{ color: "var(--ink-2)", maxWidth: 720 }}>
          Auditámos 45 empresas SaaS B2B portuguesas em 3 motores generativos
          (Claude, Gemini, Grok), 3 corridas por categoria, web search OFF —
          recall do treino. <strong>31% são completamente invisíveis</strong>;
          apenas hr-saúde tem 100% de visibilidade; hotelaria-turismo está em
          0%.
        </p>

        <p style={{ fontSize: 12, color: "var(--ink-3)", fontStyle: "italic" }}>
          Fonte: <em>O Estado da Visibilidade em IA do SaaS B2B Português 2026</em>,
          destaque.ai · Maio 2026. Metodologia e dataset completo no estudo público.
        </p>
      </motion.div>
    </SlideShell>
  );
}
