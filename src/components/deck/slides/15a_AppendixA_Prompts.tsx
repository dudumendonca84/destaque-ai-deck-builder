"use client";

import { SlideShell } from "../primitives/SlideShell";
import type { DeckData, SlideProps } from "../types";
import { allAuditedPrompts } from "./04_LiveAudit";
import { ENGINE_COUNT } from "@/lib/llm/models";

/**
 * Apêndice A — os prompts auditados completos. Cada prompt aparece numa
 * "caixa de input" inspirada nas barras de pesquisa das LLMs: card branco
 * com cantos arredondados, número em mono à esquerda, texto do prompt à
 * direita. Sinal visual de "isto é literalmente o que perguntámos à IA".
 *
 * Paginado: 6 por página deixa folga vertical mesmo com prompts de 3-4
 * linhas, e mantém o último item acima da barra de navegação fixa.
 */
const PROMPTS_PER_PAGE = 6;

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
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxWidth: 940,
        }}
      >
        {prompts.map((p, i) => {
          const num = String(start + i + 1).padStart(2, "0");
          return (
            <div
              key={start + i}
              style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr",
                gap: 14,
                padding: "14px 18px",
                background: "#FFFFFF",
                border: "1px solid var(--rule-soft)",
                borderRadius: 12,
                boxShadow: "0 1px 0 rgba(0, 0, 0, 0.02)",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono-jetbrains), ui-monospace, monospace",
                  fontSize: 11,
                  color: "var(--ink-3)",
                  letterSpacing: "0.05em",
                  paddingTop: 3,
                }}
              >
                {num}
              </span>
              <span
                style={{
                  fontSize: 14,
                  lineHeight: 1.5,
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
