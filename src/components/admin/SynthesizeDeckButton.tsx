"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Botão para disparar o Step 12 — Claude sintetiza o deck consumindo
 * skill inteira + audit + scan + prospect data.
 *
 * Pode demorar ~30-60s. O estado "pending" vive no DB (proposals.
 * deck_synthesis_pending) para sobreviver a refresh / abas múltiplas.
 * Quando isPending=true, faz polling a cada 5s via router.refresh()
 * para o operador ver quando termina sem ter de refrescar à mão.
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

  // Auto-refresh a cada 5s enquanto o servidor diz que está pending.
  // Pára logo que o flag baixa (sucesso ou erro do endpoint).
  useEffect(() => {
    if (!isPending) return;
    const t = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(t);
  }, [isPending, router]);

  async function trigger() {
    setError(null);
    // Refresh imediato para puxar o flag pending=true e desactivar o botão.
    router.refresh();
    try {
      const res = await fetch(`/api/audit/${proposalId}/synthesize`, {
        method: "POST",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Falha a sintetizar.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha a sintetizar.");
    } finally {
      router.refresh();
    }
  }

  const busy = isPending;
  const label = busy
    ? "A sintetizar… (~30-60s)"
    : hasExisting
      ? "Re-sintetizar deck"
      : "Sintetizar deck (Step 12)";

  return (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        className="btn"
        onClick={() => void trigger()}
        disabled={busy}
      >
        {label}
      </button>
      {busy && (
        <p className="body-s" style={{ color: "var(--ink-3)", marginTop: 8 }}>
          A página actualiza-se automaticamente quando terminar — podes mudar de aba.
        </p>
      )}
      {synthesizedAt && !busy && (
        <p className="body-s" style={{ color: "var(--ink-3)", marginTop: 8 }}>
          Última síntese: {new Date(synthesizedAt).toLocaleString("pt-PT")}
          {source ? ` · source: ${source}` : ""}
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
