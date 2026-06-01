"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Botão para enfileirar a síntese do deck (Step 12). NÃO chama Claude
 * API — marca `deck_synthesis_pending = true` no DB. A síntese real
 * corre na Routine "Synthesize-pending-decks" do Claude Code Web (plano
 * Max, custo zero), que o operador dispara manualmente ("Run now") ou
 * aguarda o cron diário das 9:00.
 *
 * O estado pending vive no DB para sobreviver a refresh / abas. Enquanto
 * pending=true, faz polling a cada 10s para o operador ver quando a
 * Routine concluir (deck_synthesized_at muda, pending baixa).
 */

type Props = {
  proposalId: string;
  hasExisting: boolean;
  isPending: boolean;
  synthesizedAt: string | null;
  source: "claude" | "fallback" | null;
};

export function SynthesizeDeckButton({
  proposalId,
  hasExisting,
  isPending,
  synthesizedAt,
  source,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [justQueued, setJustQueued] = useState(false);

  // Enquanto pending, faz polling para apanhar a conclusão da Routine.
  useEffect(() => {
    if (!isPending) return;
    const t = setInterval(() => router.refresh(), 10000);
    return () => clearInterval(t);
  }, [isPending, router]);

  async function trigger() {
    setError(null);
    try {
      const res = await fetch(`/api/audit/${proposalId}/synthesize`, {
        method: "POST",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Falha a enfileirar.");
      } else {
        setJustQueued(true);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha a enfileirar.");
    }
  }

  const queued = isPending || justQueued;

  return (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        className="btn"
        onClick={() => void trigger()}
        disabled={queued}
      >
        {queued
          ? "Em fila para síntese"
          : hasExisting
            ? "Marcar para re-sintetizar"
            : "Marcar para sintetizar (Step 12)"}
      </button>
      {queued && (
        <p className="body-s" style={{ color: "var(--ink-3)", marginTop: 8 }}>
          Proposta em fila. Corre a Routine <strong>Synthesize-pending-decks</strong> no
          Claude Code Web (&ldquo;Run now&rdquo;) ou aguarda o run diário das 9:00. A página
          actualiza-se sozinha quando a síntese concluir.
        </p>
      )}
      {synthesizedAt && !queued && (
        <p className="body-s" style={{ color: "var(--ink-3)", marginTop: 8 }}>
          Última síntese: {new Date(synthesizedAt).toLocaleString("pt-PT")}
          {source ? ` · source: ${source}` : ""}
          {source === "fallback" && " (fallback — re-sintetiza para deck completo)"}
        </p>
      )}
      {error && (
        <p className="body-s" style={{ color: "var(--red)", marginTop: 8 }}>
          {error}
        </p>
      )}
    </div>
  );
}
