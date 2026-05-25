"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";
import type { ActionItem } from "@/lib/llm/synthesize-deck";

/**
 * Slide 21 — Apêndice F · Plano personalizado SINAL.
 * Renderiza o output da Routine "synthesize-pending-decks" que corre
 * no Claude Code Max do operador. Output é markdown rico (não JSON
 * espremido), por isso usa react-markdown.
 *
 * Backwards-compat: campos `*_md` são preferidos, fallback para campos
 * legacy (string simples).
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

function MD({ children }: { children: string }) {
  return (
    <div className="md-body">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}

function ActionCard({ action, index }: { action: ActionItem; index: number }) {
  const why = action.why_md ?? action.why ?? "";
  const impact = action.impact_md ?? action.impact ?? "";
  const sourceUrl = action.source_url ?? action.source;
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
      <div className="action-card__why">
        <MD>{why}</MD>
      </div>
      {impact && (
        <div className="action-card__impact">
          <strong>Impacto típico:</strong>{" "}
          <span><MD>{impact}</MD></span>
        </div>
      )}
      {action.anchor && (
        <span className="action-card__source">Origem: {action.anchor}</span>
      )}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="action-card__source"
          style={{ textDecoration: "underline" }}
        >
          {sourceUrl}
        </a>
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
          A análise personalizada SINAL é gerada pela Routine{" "}
          <code>synthesize-pending-decks</code> no Claude Code Max — cada audit pendente é
          processado uma vez por hora. Volta dentro de algum tempo, ou pede ao admin para
          disparar manualmente.
        </p>
      </SlideShell>
    );
  }

  const horizons: Array<"h1" | "h2" | "h3" | "ongoing"> = ["h1", "h2", "h3", "ongoing"];
  const exec = synth.executive_reading_md ?? synth.executive_reading ?? "";

  return (
    <SlideShell index={21} total={22} eyebrow="Apêndice F · Plano personalizado SINAL">
      <h2 className="tx-h2" style={{ marginBottom: 24 }}>
        Análise editorial.
      </h2>

      {exec && (
        <div className="executive-reading">
          <MD>{exec}</MD>
        </div>
      )}

      {synth.research_additional_md && (
        <div className="research-additional">
          <h3 className="tx-h3" style={{ marginBottom: 12, marginTop: 32 }}>
            Research adicional ao vivo
          </h3>
          <MD>{synth.research_additional_md}</MD>
        </div>
      )}

      {synth.critical_findings.length > 0 && (
        <div className="findings-summary">
          <h3 className="tx-h3" style={{ marginBottom: 12, marginTop: 32 }}>
            Findings críticos
          </h3>
          <ul className="findings-summary__list">
            {synth.critical_findings.map((f, i) => (
              <li key={i}>
                <span className="findings-summary__dim">
                  {DIMENSION_LABEL[f.dimension] ?? f.dimension}
                </span>
                <span className="findings-summary__title">{f.title}</span>
                <div className="findings-summary__why">
                  <MD>{f.why_md ?? f.why ?? ""}</MD>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3 className="tx-h3" style={{ marginBottom: 12, marginTop: 32 }}>
        Plano de acção por horizonte
      </h3>
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
                <dd>
                  <MD>{qa.a_md ?? qa.a ?? ""}</MD>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </SlideShell>
  );
}
