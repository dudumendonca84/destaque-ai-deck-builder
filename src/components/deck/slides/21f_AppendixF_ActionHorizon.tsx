"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps, DeckData } from "../types";
import type { ActionItem } from "@/lib/llm/synthesize-deck";

export type Horizon = "h1" | "h2" | "h3" | "ongoing";

import { DIMENSION_LABEL } from "@/lib/skill/dimensions";

const HORIZON: Record<Horizon, { eyebrow: string; title: string }> = {
  h1: { eyebrow: "Plano · H1", title: "O que fazemos primeiro." },
  h2: { eyebrow: "Plano · H2", title: "Onde ganhamos tração." },
  h3: { eyebrow: "Plano · H3", title: "Consolidação." },
  ongoing: { eyebrow: "Plano · contínuo", title: "Manutenção." },
};

/** Acções por página do slide de horizonte. Defensivo: cada linha pode
 * ter título de 2 linhas + why de 2 linhas + dimensão + effort, dando
 * facilmente 110-130px por acção. Slide útil ronda 540px, 4 cabe sem
 * o último ser tapado pela barra de navegação fixa. */
const ACTIONS_PER_PAGE = 4;

export function actionsFor(deck: DeckData, horizon: Horizon): ActionItem[] {
  return deck.synthesized?.action_plan?.[horizon] ?? [];
}

export function actionsPageCount(deck: DeckData, horizon: Horizon): number {
  const total = actionsFor(deck, horizon).length;
  if (total === 0) return 0;
  return Math.max(1, Math.ceil(total / ACTIONS_PER_PAGE));
}

/** Condensa o why a 1 frase para a vista de plano (a profundidade vive
 * nos findings). Evita overflow com 5-7 acções por horizonte. */
function oneLine(md: string): string {
  return (md ?? "")
    .replace(/[*_`#]/g, "")
    .split(/(?<=[.!?])\s+/)[0]
    ?.trim() ?? "";
}

export function AppendixFActionHorizon({
  deck,
  horizon = "h1",
  page = 0,
  pageCount = 1,
}: SlideProps & { horizon?: Horizon }) {
  const allActions = actionsFor(deck, horizon);
  if (allActions.length === 0) return null;

  const start = page * ACTIONS_PER_PAGE;
  const actions = allActions.slice(start, start + ACTIONS_PER_PAGE);
  if (actions.length === 0) return null;

  const meta = HORIZON[horizon];
  const eyebrow = pageCount > 1 ? `${meta.eyebrow} · ${page + 1}/${pageCount}` : meta.eyebrow;

  return (
    <SlideShell eyebrow={eyebrow}>
      <h2 className="tx-h2" style={{ marginBottom: 28, maxWidth: 900 }}>
        {meta.title}
      </h2>

      <div style={{ maxWidth: 1040 }}>
        {actions.map((a, i) => (
          <motion.div
            key={`${a.title}-${start + i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 * i }}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 130px",
              gap: 20,
              alignItems: "baseline",
              padding: "14px 0",
              borderTop: "1px solid var(--rule-soft)",
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
            <div>
              <div style={{ fontSize: 16, lineHeight: 1.35, color: "var(--ink)", marginBottom: 4 }}>
                {a.title}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-3)" }}>
                {oneLine(a.why_md ?? a.why ?? "")}
              </div>
            </div>
            <span
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                textAlign: "right",
                fontFamily: "var(--font-mono-jetbrains)",
              }}
            >
              {a.effort}
            </span>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
