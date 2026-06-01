"use client";

import { SlideShell } from "../primitives/SlideShell";
import type { DeckData, SlideProps } from "../types";
import { allAuditedPrompts } from "./04_LiveAudit";
import { ENGINE_COUNT } from "@/lib/llm/models";

/**
 * Apêndice A — lista de prompts sobre régua, padrão v12. SEM cartões,
 * SEM caixas. Cada prompt = uma linha com número mono esbatido à
 * esquerda + texto Inter à direita; divisória 1px var(--rule-paper)
 * entre itens. Layout 2 colunas para densidade horizontal.
 *
 * 8/página com folga vertical em 1280×720 do print; mantém 3-4 páginas
 * para 25 prompts, numeração contínua entre páginas.
 */
const PROMPTS_PER_PAGE = 8;
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
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 24, maxWidth: 760 }}>
        {all.length} prompts × {ENGINE_COUNT} motores. A marca não aparece em nenhum.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
          columnGap: 36,
        }}
      >
        {prompts.map((p, i) => {
          const n = start + i + 1;
          return (
            <div
              key={start + i}
              style={{
                display: "grid",
                gridTemplateColumns: "28px 1fr",
                gap: 12,
                padding: "12px 0",
                borderTop: "1px solid var(--rule-paper)",
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono-jetbrains), ui-monospace, monospace",
                  fontSize: 10,
                  color: "var(--ink-muted)",
                  letterSpacing: "0.05em",
                }}
              >
                {String(n).padStart(2, "0")}
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
