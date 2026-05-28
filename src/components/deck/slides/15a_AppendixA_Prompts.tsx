"use client";

import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";
import { allAuditedPrompts } from "./04_LiveAudit";

/**
 * Apêndice A — os prompts auditados completos, movidos do slide 04
 * (que agora lidera com o 0%). Prova detalhada para quem quer.
 */
export function AppendixAPrompts({ deck }: SlideProps) {
  const prompts = allAuditedPrompts(deck);
  if (prompts.length === 0) return null;

  return (
    <SlideShell eyebrow="Apêndice A · prompts auditados">
      <h2 className="tx-h2" style={{ marginBottom: 8 }}>
        Os prompts que <em className="mark">decidem</em> a categoria.
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 28, maxWidth: 760 }}>
        {prompts.length} prompts × 6 motores. A marca não aparece em nenhum.
      </p>
      <ol
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
          <li
            key={i}
            style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-2)" }}
          >
            {p}
          </li>
        ))}
      </ol>
    </SlideShell>
  );
}
