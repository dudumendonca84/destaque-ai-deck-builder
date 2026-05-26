"use client";

import { useState, useTransition } from "react";
import { sendProposal } from "@/app/(admin)/admin/proposals/actions";

type Props = {
  proposalId: string;
  alreadySent: boolean;
  /** Se true, botão fica disabled e mostra razão. Evita enviar deck com
   * Slide 21 vazio (Análise SINAL ainda a correr na Routine). */
  notReady?: boolean;
  notReadyReason?: string;
};

export function SendProposalButton({
  proposalId,
  alreadySent,
  notReady = false,
  notReadyReason,
}: Props) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  function send() {
    setResult(null);
    start(async () => {
      const r = await sendProposal(proposalId);
      if (r.ok) {
        setResult({ ok: true, msg: `Enviado para ${r.to}.` });
      } else {
        setResult({ ok: false, msg: r.error });
      }
    });
  }

  const disabled = pending || notReady;

  return (
    <div className="send-proposal">
      <button type="button" className="btn" onClick={send} disabled={disabled}>
        {pending ? "A enviar…" : alreadySent ? "Reenviar ao cliente →" : "Enviar ao cliente →"}
      </button>
      {notReady && notReadyReason && (
        <span
          className="send-proposal__msg"
          style={{ color: "var(--ink-3)" }}
        >
          {notReadyReason}
        </span>
      )}
      {result && (
        <span className={`send-proposal__msg${result.ok ? " is-ok" : " is-err"}`}>
          {result.msg}
        </span>
      )}
    </div>
  );
}
