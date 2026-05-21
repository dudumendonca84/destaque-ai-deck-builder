"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuditStatus } from "@/lib/supabase/types";

type Props = {
  proposalId: string;
  initialStatus: AuditStatus;
};

export function AuditRunner({ proposalId, initialStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<AuditStatus>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/audit/${proposalId}/status`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { audit_status: AuditStatus };
      setStatus(data.audit_status);
      if (data.audit_status === "completed" || data.audit_status === "failed") {
        router.refresh();
      }
    } catch {
      // ignora — tenta de novo no próximo tick
    }
  }, [proposalId, router]);

  const start = useCallback(async () => {
    setError(null);
    setStatus("running");
    try {
      const res = await fetch("/api/audit/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ proposal_id: proposalId }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setStatus("failed");
        setError(data.error ?? "Falha na auditoria.");
      } else {
        setStatus("completed");
        router.refresh();
      }
    } catch (e) {
      setStatus("failed");
      setError(e instanceof Error ? e.message : "Falha na auditoria.");
    }
  }, [proposalId, router]);

  // Auto-arranca se estiver pendente; faz polling se estiver a correr.
  useEffect(() => {
    if (status === "pending" && !started.current) {
      started.current = true;
      void start();
    }
    if (status === "running") {
      const id = setInterval(poll, 4000);
      return () => clearInterval(id);
    }
  }, [status, start, poll]);

  if (status === "completed") {
    return (
      <div className="audit-banner" data-state="ok">
        <span className="pulse-dot" data-ok />
        Auditoria concluída.
      </div>
    );
  }

  if (status === "running" || status === "pending") {
    return (
      <div className="audit-banner" data-state="running">
        <span className="pulse-dot" />
        Auditoria GEO a correr nos 4 motores… isto pode demorar 1-2 minutos.
      </div>
    );
  }

  return (
    <div className="audit-banner" data-state="failed">
      <span>Auditoria falhou{error ? ` — ${error}` : ""}.</span>
      <button type="button" className="btn btn--ghost" onClick={() => void start()}>
        Tentar de novo
      </button>
    </div>
  );
}
