"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  auditCompletedAt: string | null;
  deckSynthesisPending: boolean;
  deckBlocksExists: boolean;
  deckSynthesizedAt: string | null;
};

/**
 * Fase 2 do deck: Routine SINAL no Claude Code Max processa o audit em
 * markdown rico. Não temos polling real-time da Routine (corre fora) —
 * apenas estado via Supabase. Polling client refaz server-render cada 30s.
 */
export function SynthesisProgress({
  auditCompletedAt,
  deckSynthesisPending,
  deckBlocksExists,
  deckSynthesizedAt,
}: Props) {
  const router = useRouter();
  const inProgress = deckSynthesisPending && !deckBlocksExists;

  useEffect(() => {
    if (!inProgress) return;
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [inProgress, router]);

  if (!auditCompletedAt) {
    return (
      <div className="audit-banner" data-state="pending">
        Fase 2 — Análise SINAL · aguarda conclusão da Fase 1
      </div>
    );
  }

  if (inProgress) {
    const elapsedMs = Date.now() - new Date(auditCompletedAt).getTime();
    const elapsedMin = Math.max(0, Math.floor(elapsedMs / 60_000));
    // Estimativa: 30-60 min. Usa 60 como target para a barra.
    const pctEstimate = Math.min(99, Math.round((elapsedMin / 60) * 100));
    return (
      <div className="audit-banner" data-state="running">
        <span className="pulse-dot" />
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 8 }}>
            Fase 2 — Análise SINAL em curso (Routine no Claude Code Max).
            Conclusão estimada 30-60 min.
          </div>
          <div className="audit-progress">
            <div className="audit-progress__fill" style={{ width: `${pctEstimate}%` }} />
          </div>
        </div>
        <span className="mono" style={{ color: "var(--ink-3)" }}>
          há {elapsedMin}min
        </span>
      </div>
    );
  }

  if (deckBlocksExists && deckSynthesizedAt) {
    return (
      <div className="audit-banner" data-state="ok">
        <span className="pulse-dot" data-ok />
        Fase 2 — Análise SINAL concluída a{" "}
        {new Date(deckSynthesizedAt).toLocaleString("pt-PT")}.
      </div>
    );
  }

  return null;
}
