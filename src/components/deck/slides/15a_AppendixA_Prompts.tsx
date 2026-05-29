"use client";

import { SlideShell } from "../primitives/SlideShell";
import type { DeckData, SlideProps } from "../types";
import { allAuditedPrompts } from "./04_LiveAudit";

/**
 * Apêndice A — os prompts auditados completos, movidos do slide 04
 * (que agora lidera com o 0%). Prova detalhada para quem quer.
 *
 * Paginado: a lista pode ter dezenas de prompts e cada prompt vai até
 * 2-3 linhas — defensivo no número por página para evitar overflow.
 */
const PROMPTS_PER_PAGE = 10;

export function appendixAPromptsPageCount(deck: DeckData): number {
  const n = allAuditedPrompts(deck).length;
  return n === 0 ? 0 : Math.ceil(n / PROMPTS_PER_PAGE);
}

export function AppendixAPrompts({ deck, page = 0, pageCount = 1 }: SlideProps) {
  const all = allAuditedPrompts(deck);
  if (all.length === 0) return null;
  const start = page * PROMPTS_PER_PAGE;
  const prompts = all.slice(start, start + PROMPTS_PER_PAGE);

  return (
    <SlideShell
      eyebrow={`Apêndice A · prompts auditados${pageCount > 1 ? ` · ${page + 1} de ${pageCount}` : ""}`}
    >
      <h2 className="tx-h2" style={{ marginBottom: 8 }}>
        Os prompts que <em className="mark">decidem</em> a categoria.
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 28, maxWidth: 760 }}>
        {all.length} prompts × 6 motores. A marca não aparece em nenhum.
      </p>
      <ol
        // Continua a numeração entre páginas: pág. 2 começa em #11, não em #1.
        start={start + 1}
        style={{
          margin: 0,
          paddingLeft: 22,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 940,
        }}
      >
        {prompts.map((p, i) => (
          <li key={start + i} style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-2)" }}>
            {p}
          </li>
        ))}
      </ol>
    </SlideShell>
  );
}
