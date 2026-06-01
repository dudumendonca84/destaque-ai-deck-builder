"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { DeckData, SlideProps } from "../types";
import { TrackerDashboard } from "../tracker/TrackerDashboard";
import { TrackerPromptTable } from "../tracker/TrackerPromptTable";
import { TrackerEngineBreakdown } from "../tracker/TrackerEngineBreakdown";
import { TrackerReportPreview } from "../tracker/TrackerReportPreview";

/**
 * Visibility Tracker preview — o que o prospect recebe no retainer.
 *
 * São 4 blocos ricos (dashboard, prompts, motor-a-motor, relatório). Juntos
 * são mais altos que um viewport → paginados em 2 slides (2 blocos cada),
 * nunca scroll (decisão v12). As caixas mantêm-se: é mockup de PRODUTO, a
 * excepção explícita ao sistema "sem caixa" do v12.
 *
 * Tier `free` → 1 slide teaser (sem dados, incentivo a upgrade). Tier pago
 * → 2 slides com os dados reais.
 */

const BLOCKS_PER_PAGE = 2;

function isPaid(deck: DeckData): boolean {
  return deck.auditTier === "diagnostic" || deck.auditTier === "premium";
}

export function trackerPageCount(deck: DeckData): number {
  return isPaid(deck) ? 2 : 1;
}

export function Tracker({ deck, active, page = 0, pageCount = 1 }: SlideProps) {
  if (!isPaid(deck)) {
    return (
      <SlideShell eyebrow="Visibility Tracker · preview">
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

  const blocks = [
    {
      head: "1 · Dashboard",
      node: <TrackerDashboard audit={deck.audit} active={active} />,
    },
    {
      head: "2 · Prompts em gap",
      node: <TrackerPromptTable auditRuns={deck.auditRuns} prompts={deck.prompts} />,
    },
    {
      head: "3 · Motor a motor",
      node: <TrackerEngineBreakdown audit={deck.audit} />,
    },
    {
      head: "4 · Relatório mensal",
      node: <TrackerReportPreview companyName={deck.companyName} />,
    },
  ];

  const start = page * BLOCKS_PER_PAGE;
  const shown = blocks.slice(start, start + BLOCKS_PER_PAGE);
  const suffix = pageCount > 1 ? ` · ${page + 1}/${pageCount}` : "";

  return (
    <SlideShell eyebrow={`Visibility Tracker · preview${suffix}`}>
      <h2 className="tx-h2" style={{ marginBottom: 8 }}>
        O que recebes <em className="mark">todos os meses</em>
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 24 }}>
        {page === 0
          ? "Mockup do dashboard contínuo do retainer, alimentado com os teus dados reais do audit deste mês."
          : "Breakdown por motor e o relatório mensal que recebes por email."}
      </p>

      <div className="tracker-grid">
        {shown.map((b, i) => (
          <motion.div
            className="tracker-block"
            key={b.head}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: active ? 1 : 0, y: active ? 0 : 10 }}
            transition={{ duration: 0.4, delay: 0.08 * i }}
          >
            <span className="tracker-block__head">{b.head}</span>
            {b.node}
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
