"use client";

import { motion } from "framer-motion";

export function Definition() {
  return (
    <div className="slide" data-tone="ink">
      <div className="slide__inner slide__inner--center">
        <motion.div
          className="slide__eyebrow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 24 }}
        >
          <span className="num">02</span>
          <span className="bar" />
          <span>A definição</span>
        </motion.div>

        <motion.h2
          className="tx-h1"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          style={{ color: "var(--paper)", maxWidth: 920, marginBottom: 32 }}
        >
          A categoria tem <em className="mark">vários nomes</em>.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "20px 48px",
            maxWidth: 920,
            color: "var(--ink-4)",
          }}
        >
          <div>
            <div style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 28, color: "var(--paper)", marginBottom: 4 }}>
              SEO
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <b style={{ color: "var(--paper)" }}>Search Engine Optimization.</b> Pesquisa clássica — Google, Bing. Otimizar para 10 links azuis.
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 28, color: "var(--paper)", marginBottom: 4 }}>
              GEO
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <b style={{ color: "var(--paper)" }}>Generative Engine Optimization.</b> Aparecer em respostas geradas por IA — ChatGPT, Claude, Gemini, Grok.
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 28, color: "var(--paper)", marginBottom: 4 }}>
              AEO
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <b style={{ color: "var(--paper)" }}>Answer Engine Optimization.</b> Otimizar conteúdo para resposta directa (snippets, voice, AI Overviews).
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 28, color: "var(--paper)", marginBottom: 4 }}>
              AISO <span style={{ fontSize: 11, opacity: 0.6 }}>/ LLM SEO</span>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <b style={{ color: "var(--paper)" }}>AI Search Optimization.</b> Termo guarda-chuva. SINAL trata os três como uma só disciplina integrada.
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{ marginTop: 32, fontSize: 12, color: "var(--ink-4)", opacity: 0.6, maxWidth: 680 }}
        >
          Nomes distintos, problema único — ser <em className="mark">citável</em> pelos motores que decidem por quem clica.
        </motion.p>
      </div>
    </div>
  );
}
