"use client";

import { useState, useTransition } from "react";
import { sendProposal } from "@/app/(admin)/admin/proposals/actions";

type Props = {
  proposalId: string;
  alreadySent: boolean;
};

export function SendProposalButton({ proposalId, alreadySent }: Props) {
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

  return (
    <div className="send-proposal">
      <button type="button" className="btn" onClick={send} disabled={pending}>
        {pending ? "A enviar…" : alreadySent ? "Reenviar ao cliente →" : "Enviar ao cliente →"}
      </button>
      {result && (
        <span className={`send-proposal__msg${result.ok ? " is-ok" : " is-err"}`}>
          {result.msg}
        </span>
      )}
    </div>
  );
}
