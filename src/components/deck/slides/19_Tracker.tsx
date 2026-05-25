"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";
import { TrackerDashboard } from "../tracker/TrackerDashboard";
import { TrackerPromptTable } from "../tracker/TrackerPromptTable";
import { TrackerEngineBreakdown } from "../tracker/TrackerEngineBreakdown";
import { TrackerReportPreview } from "../tracker/TrackerReportPreview";

/**
 * Slide 19 — Visibility Tracker preview.
 * Bloco completo mostrando ao prospect o que recebe no retainer.
 *
 * Por design aparece em decks `diagnostic`/`premium` (não em `free`,
 * para manter incentivo a upgrade). Em `free` mostra teaser minimal.
 */

export function Tracker({ deck, active }: SlideProps) {
  const isPaidTier = deck.auditTier === "diagnostic" || deck.auditTier === "premium";

  if (!isPaidTier) {
    return (
      <SlideShell index={19} total={22} eyebrow="Visibility Tracker · preview">
        <h2 className="tx-h2" style={{ marginBottom: 24 }}>
          O <em className="mark">tracker</em> contínuo — só no retainer.
        </h2>
        <p className="body-m" style={{ color: "var(--ink-3)", maxWidth: 640 }}>
          Os clientes em retainer recebem este dashboard em directo, com sparkles
          de tendência por prompt, breakdown por motor, e relatório mensal entregue
          por email. Faz upgrade para Diagnóstico para veres o preview completo
          com os teus dados reais.
        </p>
      </SlideShell>
    );
  }

  return (
    <SlideShell index={19} total={22} eyebrow="Visibility Tracker · preview">
      <h2 className="tx-h2" style={{ marginBottom: 8 }}>
        O que recebes <em className="mark">todos os meses</em>
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 24 }}>
        Mockup do dashboard contínuo do retainer, alimentado com os teus dados reais
        do audit deste mês.
      </p>

      <div className="tracker-grid">
        <motion.div
          className="tracker-block"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 10 }}
          transition={{ duration: 0.4 }}
        >
          <span className="tracker-block__head">1 · Dashboard</span>
          <TrackerDashboard audit={deck.audit} active={active} />
        </motion.div>

        <motion.div
          className="tracker-block"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 10 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <span className="tracker-block__head">2 · Prompts em gap</span>
          <TrackerPromptTable auditRuns={deck.auditRuns} prompts={deck.prompts} />
        </motion.div>

        <motion.div
          className="tracker-block"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 10 }}
          transition={{ duration: 0.4, delay: 0.16 }}
        >
          <span className="tracker-block__head">3 · Motor a motor</span>
          <TrackerEngineBreakdown audit={deck.audit} />
        </motion.div>

        <motion.div
          className="tracker-block"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: active ? 1 : 0, y: active ? 0 : 10 }}
          transition={{ duration: 0.4, delay: 0.24 }}
        >
          <span className="tracker-block__head">4 · Relatório mensal</span>
          <TrackerReportPreview companyName={deck.companyName} />
        </motion.div>
      </div>
    </SlideShell>
  );
}
