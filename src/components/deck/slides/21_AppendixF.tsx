"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";
import type { ActionItem } from "@/lib/llm/synthesize-deck";

/**
 * Slide 21 — Apêndice F · Plano personalizado SINAL.
 * Renderiza o output do Step 12 (synthesize-deck.ts).
 *
 * Se synthesized estiver null, mostra placeholder a indicar que o
 * admin precisa de clicar "Sintetizar deck" para gerar.
 */

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

const HORIZON_LABEL: Record<"h1" | "h2" | "h3" | "ongoing", string> = {
  h1: "H1 · Semana 1-2",
  h2: "H2 · Semana 3-8",
  h3: "H3 · Mês 2-6",
  ongoing: "Contínuo",
};

function ActionCard({ action, index }: { action: ActionItem; index: number }) {
  return (
    <motion.div
      className="action-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.04 * index }}
    >
      <div className="action-card__head">
        <span className="action-card__dim">{DIMENSION_LABEL[action.dimension] ?? action.dimension}</span>
        <span className="action-card__effort">{action.effort}</span>
      </div>
      <span className="action-card__title">{action.title}</span>
      <p className="action-card__why">{action.why}</p>
      <p className="action-card__impact">
        <strong>Impacto típico:</strong> {action.impact}
      </p>
      {action.source && (
        <span className="action-card__source">{action.source}</span>
      )}
    </motion.div>
  );
}

export function AppendixF({ deck }: SlideProps) {
  const synth = deck.synthesized;

  if (!synth) {
    return (
      <SlideShell index={21} total={22} eyebrow="Apêndice F · Plano personalizado">
        <h2 className="tx-h2" style={{ marginBottom: 12 }}>
          Plano personalizado — <em className="mark">por gerar</em>.
        </h2>
        <p className="body-m" style={{ color: "var(--ink-3)", maxWidth: 640 }}>
          O plano personalizado SINAL é gerado por Claude com a skill inteira (princípios,
          metrics, benchmarks, gap_action_mapping) + dados reais deste audit. Admin: clica
          em <strong>Sintetizar deck</strong> na página de detalhe da proposta.
        </p>
      </SlideShell>
    );
  }

  const horizons: Array<"h1" | "h2" | "h3" | "ongoing"> = ["h1", "h2", "h3", "ongoing"];

  return (
    <SlideShell index={21} total={22} eyebrow="Apêndice F · Plano personalizado SINAL">
      <h2 className="tx-h2" style={{ marginBottom: 12 }}>
        O que faríamos, <em className="mark">por horizonte</em>.
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 32, maxWidth: 720 }}>
        {synth.executive_reading}
      </p>

      {synth.critical_findings.length > 0 && (
        <div className="findings-summary">
          <h3 className="tx-h3" style={{ marginBottom: 12 }}>Findings críticos</h3>
          <ul className="findings-summary__list">
            {synth.critical_findings.map((f, i) => (
              <li key={i}>
                <span className="findings-summary__dim">
                  {DIMENSION_LABEL[f.dimension] ?? f.dimension}
                </span>
                <span className="findings-summary__title">{f.title}</span>
                <p className="findings-summary__why">{f.why}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="action-plan-grid">
        {horizons.map((h) => {
          const actions = synth.action_plan[h];
          if (!actions || actions.length === 0) return null;
          return (
            <div className="horizon-block" key={h}>
              <h3 className="horizon-block__title">{HORIZON_LABEL[h]}</h3>
              <div className="horizon-block__actions">
                {actions.map((a, i) => (
                  <ActionCard key={`${h}-${i}`} action={a} index={i} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {synth.faq.length > 0 && (
        <div className="faq-block">
          <h3 className="tx-h3" style={{ marginBottom: 16, marginTop: 32 }}>FAQ</h3>
          <dl className="faq-list">
            {synth.faq.map((qa, i) => (
              <div key={i} className="faq-item">
                <dt>{qa.q}</dt>
                <dd>{qa.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </SlideShell>
  );
}
