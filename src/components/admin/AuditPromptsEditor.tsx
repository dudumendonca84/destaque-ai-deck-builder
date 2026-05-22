"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setAuditTier,
  saveAuditPrompts,
} from "@/app/(admin)/admin/proposals/[id]/audit/actions";
import type { AuditPrompt, AuditTier, PromptCategory } from "@/lib/supabase/types";

const CATEGORY_LABEL: Record<PromptCategory, string> = {
  generic_category: "Categoria genérica",
  direct_comparison: "Comparação directa",
  local_recommendation: "Recomendação local",
  feature_specific: "Feature específica",
  price_comparison: "Comparação de preços",
};
const CATEGORIES = Object.keys(CATEGORY_LABEL) as PromptCategory[];

const TIER_INFO: Record<AuditTier, { label: string; count: number; calls: number }> = {
  free: { label: "Auditoria gratuita", count: 5, calls: 20 },
  diagnostic: { label: "Diagnóstico", count: 30, calls: 120 },
};

function localId(): string {
  return `manual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type Props = {
  proposalId: string;
  initialTier: AuditTier;
  initialPrompts: AuditPrompt[];
};

export function AuditPromptsEditor({ proposalId, initialTier, initialPrompts }: Props) {
  const [tier, setTier] = useState<AuditTier>(initialTier);
  const [prompts, setPrompts] = useState<AuditPrompt[]>(initialPrompts);
  const [generating, setGenerating] = useState(false);
  const [source, setSource] = useState<"claude" | "fallback" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [auditPhase, setAuditPhase] = useState<"idle" | "running" | "done">("idle");
  const [tierPending, startTier] = useTransition();
  const [savePending, startSave] = useTransition();
  const router = useRouter();

  function changeTier(next: AuditTier) {
    if (next === tier || tierPending || generating) return;
    setTier(next);
    setError(null);
    startTier(async () => {
      const r = await setAuditTier(proposalId, next);
      if (!r.ok) setError(r.error);
    });
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    setSavedMsg(null);
    try {
      const res = await fetch("/api/audit/generate-prompts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ proposal_id: proposalId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        prompts?: AuditPrompt[];
        source?: "claude" | "fallback";
      };
      if (!Array.isArray(data.prompts) || data.prompts.length === 0) {
        throw new Error("Resposta inválida.");
      }
      setPrompts(data.prompts);
      setSource(data.source ?? null);
    } catch (e) {
      setError(`Falha a gerar prompts. ${e instanceof Error ? e.message : ""}`);
    } finally {
      setGenerating(false);
    }
  }

  function editPrompt(id: string, text: string) {
    setPrompts((arr) => arr.map((p) => (p.id === id ? { ...p, text } : p)));
  }
  function removePrompt(id: string) {
    setPrompts((arr) => arr.filter((p) => p.id !== id));
  }
  function addPrompt(category: PromptCategory) {
    setPrompts((arr) => [
      ...arr,
      {
        id: localId(),
        text: "",
        category,
        intent: "",
        generated_by_model: "manual",
        generated_at: new Date().toISOString(),
      },
    ]);
  }

  const hasEmpty = prompts.some((p) => p.text.trim().length < 3);
  const canConfirm = prompts.length > 0 && !hasEmpty;

  function confirm() {
    setError(null);
    setSavedMsg(null);
    startSave(async () => {
      const saved = await saveAuditPrompts(proposalId, prompts);
      if (!saved.ok) {
        setError(saved.error);
        return;
      }
      // D2 — confirmar guarda os prompts e corre logo a auditoria.
      setAuditPhase("running");
      try {
        const res = await fetch("/api/audit/start", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ proposal_id: proposalId }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        setAuditPhase("done");
        setSavedMsg("Auditoria concluída — as respostas aparecem abaixo.");
        router.refresh();
      } catch (e) {
        setAuditPhase("idle");
        setError(`A auditoria falhou. ${e instanceof Error ? e.message : ""}`);
      }
    });
  }

  const info = TIER_INFO[tier];

  return (
    <section style={{ marginBottom: 36 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card__head">
          <h2 className="tx-h3">Tipo de auditoria</h2>
          <span className="mono body-s" style={{ color: "var(--ink-3)" }}>
            TIER
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          {(["free", "diagnostic"] as AuditTier[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`btn${tier === t ? "" : " btn--ghost"}`}
              onClick={() => changeTier(t)}
              disabled={tierPending || generating}
            >
              {TIER_INFO[t].label}
            </button>
          ))}
        </div>
        <p className="body-s" style={{ color: "var(--ink-3)", margin: 0 }}>
          {info.count} prompts × 4 motores = {info.calls} chamadas LLM
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <button
          type="button"
          className="btn"
          onClick={generate}
          disabled={generating || tierPending}
        >
          {generating ? "A gerar…" : "Gerar prompts da auditoria"}
        </button>
        {source && (
          <span className="body-s" style={{ color: "var(--ink-3)" }}>
            {source === "claude" ? "Gerado por IA (Claude)" : "Fallback — sem API key"}
          </span>
        )}
      </div>

      {error && (
        <div
          className="card"
          style={{
            borderColor: "var(--red)",
            color: "var(--red)",
            padding: 14,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {prompts.length === 0 ? (
        <p className="body-m" style={{ color: "var(--ink-3)" }}>
          Sem prompts ainda. Escolhe o tipo de auditoria e gera os prompts.
        </p>
      ) : (
        <>
          {CATEGORIES.map((cat) => {
            const items = prompts.filter((p) => p.category === cat);
            return (
              <div className="card" key={cat} style={{ marginBottom: 14 }}>
                <div className="card__head">
                  <h3 className="tx-h3">{CATEGORY_LABEL[cat]}</h3>
                  <span className="mono body-s" style={{ color: "var(--ink-3)" }}>
                    {items.length} {items.length === 1 ? "prompt" : "prompts"}
                  </span>
                </div>
                {items.length > 0 && (
                  <div className="prompt-list">
                    {items.map((p, i) => (
                      <div className="prompt-row" key={p.id}>
                        <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                        <textarea
                          rows={2}
                          value={p.text}
                          placeholder="pergunta natural que um decisor B2B faria a um LLM"
                          onChange={(e) => editPrompt(p.id, e.target.value)}
                        />
                        <button
                          type="button"
                          className="remove"
                          onClick={() => removePrompt(p.id)}
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn--ghost"
                  style={{ marginTop: items.length > 0 ? 10 : 0 }}
                  onClick={() => addPrompt(cat)}
                >
                  + Adicionar prompt
                </button>
              </div>
            );
          })}

          <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 20 }}>
            <button
              type="button"
              className="btn-big"
              onClick={confirm}
              disabled={!canConfirm || savePending}
            >
              <span>
                {auditPhase === "running"
                  ? "A correr auditoria…"
                  : savePending
                    ? "A guardar…"
                    : "Confirmar e correr auditoria"}
              </span>
              <span className="arrow">→</span>
            </button>
            <span className="body-s" style={{ color: "var(--ink-3)" }}>
              {prompts.length} prompts{hasEmpty ? " · há prompts vazios" : ""}
            </span>
          </div>
          {auditPhase === "running" && (
            <div className="audit-banner" data-state="running" style={{ marginTop: 12 }}>
              <span className="pulse-dot" />
              Auditoria GEO a correr nos 4 motores — mantém este separador aberto.
            </div>
          )}
          {savedMsg && (
            <p className="body-s" style={{ color: "var(--ink-2)", marginTop: 12 }}>
              {savedMsg}
            </p>
          )}
        </>
      )}
    </section>
  );
}
