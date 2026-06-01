"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Enfileira a síntese do deck. NÃO chama Claude API — marca
 * `deck_synthesis_pending=true`. A síntese corre na Routine
 * "Synthesize-pending-decks" do Claude Code Web.
 *
 * UX: quando pending=true NÃO mostramos um botão (que parecia clicável
 * mas não fazia nada). Mostramos um CHIP de estado discreto com ponto
 * pulsante + a acção secundária "Cancelar" para destrancar se a Routine
 * partir. Faz polling ao servidor para apanhar a conclusão.
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
  const [busy, setBusy] = useState(false);

  // Enquanto pending, faz polling para apanhar a conclusão da Routine.
  useEffect(() => {
    if (!isPending) return;
    const t = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(t);
  }, [isPending, router]);

  async function trigger() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/audit/${proposalId}/synthesize`, { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Falha a enfileirar.");
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha a enfileirar.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!confirm("Cancelar a síntese pendente? A Routine não vai processar esta proposta.")) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/audit/${proposalId}/synthesize`, { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Não foi possível cancelar.");
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível cancelar.");
    } finally {
      setBusy(false);
    }
  }

  // PENDENTE: chip de estado, não pseudo-botão.
  if (isPending) {
    return (
      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 14px",
            border: "1px solid var(--rule-soft)",
            borderRadius: 999,
            color: "var(--ink-3)",
            fontSize: 13,
            lineHeight: 1.2,
          }}
        >
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "var(--accent)",
              animation: "pulse-dot 1.4s ease-in-out infinite",
            }}
          />
          <span>Síntese a processar</span>
        </div>
        <p className="body-s" style={{ color: "var(--ink-3)", marginTop: 10, maxWidth: 640 }}>
          A Routine <strong>Synthesize-pending-decks</strong> está a correr no Claude Code Web
          (~30–60 min). A página actualiza-se sozinha quando concluir. Se passar muito tempo,
          verifica o log da Routine.
        </p>
        <button
          type="button"
          onClick={() => void cancel()}
          disabled={busy}
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "var(--ink-3)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            background: "none",
            border: 0,
            padding: 0,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy ? "A cancelar…" : "Cancelar pendente"}
        </button>
        {error && (
          <p className="body-s" style={{ color: "var(--red)", marginTop: 8 }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  // NÃO PENDENTE: botão real, clicável.
  return (
    <div style={{ marginTop: 16 }}>
      <button type="button" className="btn" onClick={() => void trigger()} disabled={busy}>
        {busy ? "A enfileirar…" : hasExisting ? "Marcar para re-sintetizar" : "Marcar para sintetizar (Step 12)"}
      </button>
      {synthesizedAt && (
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
