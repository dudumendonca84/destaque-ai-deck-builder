"use client";

import type { AuditRun } from "@/lib/supabase/types";

/**
 * Top 5 prompts — escolhidos pelo gap maior (mais respostas onde a marca
 * NÃO aparece). Sparkline mock representa a tendência projectada.
 */

type Props = {
  auditRuns: AuditRun[];
  prompts: string[];
};

function citationRate(runs: AuditRun[]): number {
  if (runs.length === 0) return 0;
  return runs.filter((r) => r.brand_present).length / runs.length;
}

function MiniBar({ value }: { value: number }) {
  // Bar simples 0-100% para mostrar citation rate por prompt.
  const w = 80;
  const fillW = Math.max(2, value * w);
  return (
    <svg width={w} height={6} viewBox={`0 0 ${w} 6`}>
      <rect x={0} y={0} width={w} height={6} fill="var(--rule-soft)" rx={3} />
      <rect x={0} y={0} width={fillW} height={6} fill="currentColor" rx={3} />
    </svg>
  );
}

export function TrackerPromptTable({ auditRuns, prompts }: Props) {
  // Agrupa por prompt, calcula CR, ordena por menor CR (= maior gap)
  const byPrompt = new Map<string, AuditRun[]>();
  for (const r of auditRuns) {
    const arr = byPrompt.get(r.prompt) ?? [];
    arr.push(r);
    byPrompt.set(r.prompt, arr);
  }
  const ranked = prompts
    .map((p) => ({
      prompt: p,
      runs: byPrompt.get(p) ?? [],
      cr: citationRate(byPrompt.get(p) ?? []),
    }))
    .sort((a, b) => a.cr - b.cr)
    .slice(0, 5);

  if (ranked.length === 0) {
    return (
      <p className="body-s" style={{ color: "var(--ink-3)" }}>
        Sem dados de prompts disponíveis.
      </p>
    );
  }

  return (
    <div className="tracker-prompt-table">
      <div className="tracker-prompt-table__head">
        <span>Prompt</span>
        <span>CR</span>
        <span>Tendência</span>
      </div>
      {ranked.map((r) => (
        <div className="tracker-prompt-table__row" key={r.prompt}>
          <span className="tracker-prompt-table__text">{r.prompt}</span>
          <span className="mono tracker-prompt-table__cr">
            {Math.round(r.cr * 100)}%
          </span>
          <span className="tracker-prompt-table__bar">
            <MiniBar value={r.cr} />
          </span>
        </div>
      ))}
    </div>
  );
}
