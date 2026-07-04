"use client";

import { useState, useTransition } from "react";
import { reopenProposal } from "@/app/(admin)/admin/proposals/actions";

type Props = {
  proposalId: string;
  /** Proposta já passou a validade (status expired ou expires_at no passado). */
  expired: boolean;
};

/** Reabre (ou prorroga) a proposta por +30 dias sem gerar outra — o mesmo
 * link volta a funcionar. */
export function ReopenProposalButton({ proposalId, expired }: Props) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  function reopen() {
    setResult(null);
    start(async () => {
      const r = await reopenProposal(proposalId);
      if (r.ok) {
        const until = new Date(r.expires_at).toLocaleDateString("pt-PT", {
          timeZone: "Europe/Lisbon",
        });
        setResult({ ok: true, msg: `Válida até ${until}. O link mantém-se.` });
      } else {
        setResult({ ok: false, msg: r.error });
      }
    });
  }

  return (
    <div className="send-proposal" style={{ marginTop: 10 }}>
      <button type="button" className="btn btn--ghost" onClick={reopen} disabled={pending}>
        {pending
          ? "A reabrir…"
          : expired
          ? "Reabrir proposta (+30 dias)"
          : "Prorrogar validade (+30 dias)"}
      </button>
      {result && (
        <span className={`send-proposal__msg${result.ok ? " is-ok" : " is-err"}`}>
          {result.msg}
        </span>
      )}
    </div>
  );
}
