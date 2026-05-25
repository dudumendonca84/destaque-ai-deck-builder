"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Botão para disparar o Step 12 — Claude sintetiza o deck consumindo
 * skill inteira + audit + scan + prospect data.
 *
 * Pode demorar ~30-60s. Mostra estado loading e erro.
 */

type Props = {
  proposalId: string;
  hasExisting: boolean;
  synthesizedAt: string | null;
  source: "claude" | "fallback" | null;
};

export function SynthesizeDeckButton({
  proposalId,
  hasExisting,
  synthesizedAt,
  source,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function trigger() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/audit/${proposalId}/synthesize`, {
        method: "POST",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Falha a sintetizar.");
      } else {
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha a sintetizar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        className="btn"
        onClick={() => void trigger()}
        disabled={busy}
      >
        {busy
          ? "A sintetizar… (~30-60s)"
          : hasExisting
            ? "Re-sintetizar deck"
            : "Sintetizar deck (Step 12)"}
      </button>
      {synthesizedAt && (
        <p className="body-s" style={{ color: "var(--ink-3)", marginTop: 8 }}>
          Última síntese: {new Date(synthesizedAt).toLocaleString("pt-PT")}
          {source ? ` · source: ${source}` : ""}
        </p>
      )}
      {error && (
        <p
          className="body-s"
          style={{ color: "var(--red)", marginTop: 8 }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
