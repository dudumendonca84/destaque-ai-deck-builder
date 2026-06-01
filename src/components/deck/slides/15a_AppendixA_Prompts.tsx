"use client";

import { SlideShell } from "../primitives/SlideShell";
import type { DeckData, SlideProps } from "../types";
import { allAuditedPrompts } from "./04_LiveAudit";
import { ENGINE_COUNT } from "@/lib/llm/models";

/**
 * Apêndice A — prompts auditados em layout de 2 colunas com cards
 * compactos tipo input de LLM. Densidade horizontal evita correr a
 * altura para baixo da barra de navegação fixa.
 *
 * 10 prompts por página (5 por coluna × 2 colunas). Para 25 prompts
 * dá 3 páginas com folga vertical em todas — a quinta linha fecha
 * acima da barra com respiro.
 */
const PROMPTS_PER_PAGE = 10;
const COLUMNS = 2;

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
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 20, maxWidth: 760 }}>
        {all.length} prompts × {ENGINE_COUNT} motores. A marca não aparece em nenhum.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
          gap: 10,
        }}
      >
        {prompts.map((p, i) => {
          const num = String(start + i + 1).padStart(2, "0");
          return (
            <div
              key={start + i}
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr",
                gap: 10,
                padding: "10px 14px",
                background: "#FFFFFF",
                border: "1px solid var(--rule-soft)",
                borderRadius: 10,
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono-jetbrains), ui-monospace, monospace",
                  fontSize: 10,
                  color: "var(--ink-3)",
                  letterSpacing: "0.05em",
                  paddingTop: 2,
                }}
              >
                {num}
              </span>
              <span
                style={{
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: "var(--ink-2)",
                }}
              >
                {p}
              </span>
            </div>
          );
        })}
      </div>
    </SlideShell>
  );
}
