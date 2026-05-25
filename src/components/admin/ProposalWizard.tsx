"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Prospect, GeneratedPromptMeta, AuditTier } from "@/lib/supabase/types";
import { createProposal } from "@/app/(admin)/admin/proposals/actions";
import { fallbackPrompts } from "@/lib/llm/fallback-prompts";

const STEPS = [
  { n: "01", label: "Tipo" },
  { n: "02", label: "Prospect" },
  { n: "03", label: "Prompts" },
  { n: "04", label: "Pricing" },
  { n: "05", label: "Mensagem" },
  { n: "06", label: "Revisão" },
] as const;

type StepKey = 0 | 1 | 2 | 3 | 4 | 5;

type Pricing = {
  diagnostico: number | null;
  sprint: number | null;
  retainer: number | null;
};

type TierOption = {
  value: AuditTier;
  label: string;
  promptsCount: number;
  description: string;
};

const TIER_OPTIONS: TierOption[] = [
  {
    value: "free",
    label: "Auditoria gratuita",
    promptsCount: 5,
    description: "Lead-gen — 5 prompts × 6 motores com modelos cost-optimized.",
  },
  {
    value: "diagnostic",
    label: "Diagnóstico",
    promptsCount: 30,
    description: "Paid — 30 prompts × 6 motores com modelos production. Fidelidade ao que o utilizador real vê.",
  },
  {
    value: "premium",
    label: "Premium",
    promptsCount: 30,
    description: "Diagnóstico + multimodal + análise técnica completa (em desenvolvimento).",
  },
];

function tierTotal(tier: AuditTier): number {
  return TIER_OPTIONS.find((t) => t.value === tier)?.promptsCount ?? 5;
}

const ENGINE_COUNT = 6;

function priceFromInput(v: string): number | null {
  const t = v.trim();
  if (t === "") return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

export function ProposalWizard({
  prospects,
  initialProspectId,
}: {
  prospects: Pick<Prospect, "id" | "company_name" | "business_type" | "location" | "target_audience" | "competitors">[];
  initialProspectId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<StepKey>(0);
  const [tier, setTier] = useState<AuditTier>("free");
  const [prospectId, setProspectId] = useState<string>(initialProspectId ?? "");
  const [prompts, setPrompts] = useState<string[]>(() => {
    const p = initialProspectId
      ? prospects.find((x) => x.id === initialProspectId)
      : undefined;
    return p
      ? fallbackPrompts({
          business_type: p.business_type,
          location: p.location,
          company_name: p.company_name,
          target_audience: p.target_audience,
        })
      : [];
  });
  const [promptsMeta, setPromptsMeta] = useState<GeneratedPromptMeta[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [pricing, setPricing] = useState<Pricing>({
    diagnostico: null,
    sprint: null,
    retainer: null,
  });
  const [message, setMessage] = useState<string>("");
  const [submitting, startSubmit] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const prospect = useMemo(
    () => prospects.find((p) => p.id === prospectId) ?? null,
    [prospectId, prospects],
  );

  const targetPromptCount = tierTotal(tier);
  const minPromptCount = tier === "free" ? 3 : Math.max(5, targetPromptCount - 5);
  const maxPromptCount = tier === "free" ? 7 : 30;

  function selectProspect(id: string) {
    setProspectId(id);
    const p = prospects.find((x) => x.id === id);
    if (p && prompts.length === 0) {
      setPrompts(
        fallbackPrompts({
          business_type: p.business_type,
          location: p.location,
          company_name: p.company_name,
          target_audience: p.target_audience,
        }),
      );
    }
  }

  const canNext = (() => {
    if (step === 0) return Boolean(tier);
    if (step === 1) return Boolean(prospectId);
    if (step === 2) {
      return (
        prompts.length >= minPromptCount && prompts.every((p) => p.trim().length >= 3)
      );
    }
    return true;
  })();

  async function generate() {
    if (!prospect) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/audit/generate-prompts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          business_type: prospect.business_type,
          location: prospect.location,
          company_name: prospect.company_name,
          target_audience: prospect.target_audience,
          competitors: prospect.competitors ?? [],
          tier,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        prompts?: string[];
        prompts_detailed?: GeneratedPromptMeta[];
      };
      if (Array.isArray(data.prompts) && data.prompts.length >= 3) {
        setPrompts(data.prompts.slice(0, maxPromptCount));
        setPromptsMeta(data.prompts_detailed ?? null);
      } else {
        throw new Error("Resposta inválida.");
      }
    } catch (e) {
      setError(`Falha a gerar prompts. ${e instanceof Error ? e.message : ""}`);
    } finally {
      setGenerating(false);
    }
  }

  function submit() {
    setError(null);
    // Sincroniza prompts_meta com os prompts actuais (edições manuais
    // perdem o meta original — limpamos para esses para evitar dados
    // inconsistentes).
    const finalPrompts = prompts.map((p) => p.trim()).filter(Boolean);
    let finalMeta: GeneratedPromptMeta[] | null = null;
    if (promptsMeta) {
      finalMeta = finalPrompts
        .map((text) => promptsMeta.find((m) => m.text === text))
        .filter((m): m is GeneratedPromptMeta => Boolean(m));
      if (finalMeta.length === 0) finalMeta = null;
    }

    startSubmit(async () => {
      const result = await createProposal({
        prospect_id: prospectId,
        audit_tier: tier,
        custom_prompts: finalPrompts,
        prompts_meta: finalMeta,
        custom_message: message.trim() || null,
        pricing_diagnostico: pricing.diagnostico,
        pricing_sprint: pricing.sprint,
        pricing_retainer: pricing.retainer,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/admin/proposals/${result.id}`);
    });
  }

  return (
    <div className="wizard">
      <div className="wizard__steps" role="tablist">
        {STEPS.map((s, i) => {
          const isActive = step === i;
          const isDone = i < step;
          return (
            <button
              key={s.n}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`wizard__step${isActive ? " active" : ""}${isDone ? " done" : ""}`}
              onClick={() => (i <= step ? setStep(i as StepKey) : null)}
            >
              <span className="n">{s.n}</span>
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* STEP 1 — Tipo (tier) */}
      {step === 0 && (
        <div className="wizard__body">
          <h2 className="tx-h2">Tipo de auditoria</h2>
          <p className="body-m" style={{ color: "var(--ink-3)" }}>
            Define a profundidade do audit e o modelo de LLM usado em cada motor.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginTop: 12,
            }}
          >
            {TIER_OPTIONS.map((t) => {
              const isSelected = tier === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  className="card"
                  style={{
                    textAlign: "left",
                    cursor: t.value === "premium" ? "not-allowed" : "pointer",
                    opacity: t.value === "premium" ? 0.5 : 1,
                    borderColor: isSelected ? "var(--ink)" : undefined,
                    background: isSelected ? "var(--paper-2)" : undefined,
                  }}
                  disabled={t.value === "premium"}
                  onClick={() => setTier(t.value)}
                >
                  <div className="card__head">
                    <h3 className="tx-h3">{t.label}</h3>
                    <span className="mono body-s" style={{ color: "var(--ink-3)" }}>
                      {t.promptsCount}P × {ENGINE_COUNT}M
                    </span>
                  </div>
                  <p className="body-s" style={{ margin: 0, color: "var(--ink-2)" }}>
                    {t.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2 — Prospect */}
      {step === 1 && (
        <div className="wizard__body">
          <h2 className="tx-h2">Para quem é esta proposta?</h2>
          <p className="body-m" style={{ color: "var(--ink-3)" }}>
            Escolhe um prospect existente. Se ainda não existe,{" "}
            <Link href="/admin/prospects/new">cria primeiro</Link>.
          </p>
          <div className="field">
            <label htmlFor="prospect">Prospect</label>
            <select
              id="prospect"
              value={prospectId}
              onChange={(e) => selectProspect(e.target.value)}
            >
              <option value="">— selecionar —</option>
              {prospects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.company_name}
                  {p.business_type ? ` · ${p.business_type}` : ""}
                  {p.location ? ` · ${p.location}` : ""}
                </option>
              ))}
            </select>
          </div>
          {prospect && (
            <div className="card">
              <div className="card__head">
                <h3 className="tx-h3">{prospect.company_name}</h3>
                <span className="mono body-s" style={{ color: "var(--ink-3)" }}>
                  CONTEXTO
                </span>
              </div>
              <p className="body-m" style={{ margin: 0, color: "var(--ink-2)" }}>
                {prospect.business_type ?? "—"} · {prospect.location ?? "—"} ·{" "}
                {prospect.target_audience ?? "público não especificado"}
              </p>
              {prospect.competitors && prospect.competitors.length > 0 && (
                <p className="body-s" style={{ marginTop: 8, marginBottom: 0 }}>
                  Concorrentes: {prospect.competitors.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP 3 — Prompts */}
      {step === 2 && (
        <div className="wizard__body">
          <h2 className="tx-h2">
            {targetPromptCount} prompts da <em className="mark">auditoria</em>
          </h2>
          <p className="body-m" style={{ color: "var(--ink-3)" }}>
            Estes são os prompts que vamos correr em ChatGPT, Claude, Gemini, Grok, DeepSeek e
            Mistral. Edita-os à vontade — entre {minPromptCount} e {maxPromptCount} prompts.
          </p>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={generate}
              disabled={generating || !prospect}
            >
              {generating ? "A gerar…" : "Gerar com IA"}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setPrompts((arr) => [...arr, ""])}
              disabled={prompts.length >= maxPromptCount}
            >
              + Adicionar prompt
            </button>
          </div>

          <div className="prompt-list">
            {prompts.map((p, i) => (
              <div className="prompt-row" key={i}>
                <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                <textarea
                  rows={2}
                  value={p}
                  placeholder="prompt natural, como um utilizador escreveria"
                  onChange={(e) => {
                    const next = prompts.slice();
                    next[i] = e.target.value;
                    setPrompts(next);
                  }}
                />
                <button
                  type="button"
                  className="remove"
                  onClick={() => setPrompts(prompts.filter((_, idx) => idx !== i))}
                  disabled={prompts.length <= minPromptCount}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
          <div className="prompt-summary">
            <span>{prompts.length} prompts</span>
            <span style={{ marginLeft: "auto" }}>
              {minPromptCount}-{maxPromptCount} prompts · {ENGINE_COUNT} motores ·{" "}
              {prompts.length * ENGINE_COUNT} chamadas
            </span>
          </div>
        </div>
      )}

      {/* STEP 4 — Pricing */}
      {step === 3 && (
        <div className="wizard__body">
          <h2 className="tx-h2">Pricing da proposta</h2>
          <p className="body-m" style={{ color: "var(--ink-3)" }}>
            Valores em euros. Em branco mostra <i>&quot;Sob consulta&quot;</i> no deck.
          </p>
          <div className="row-2">
            <div className="field">
              <label>Diagnóstico (€)</label>
              <input
                type="number"
                value={pricing.diagnostico ?? ""}
                placeholder="Sob consulta"
                onChange={(e) =>
                  setPricing((s) => ({ ...s, diagnostico: priceFromInput(e.target.value) }))
                }
              />
            </div>
            <div className="field">
              <label>Sprint (€)</label>
              <input
                type="number"
                value={pricing.sprint ?? ""}
                placeholder="Sob consulta"
                onChange={(e) =>
                  setPricing((s) => ({ ...s, sprint: priceFromInput(e.target.value) }))
                }
              />
            </div>
          </div>
          <div className="field" style={{ maxWidth: 280 }}>
            <label>Retainer (€/mês)</label>
            <input
              type="number"
              value={pricing.retainer ?? ""}
              placeholder="Sob consulta"
              onChange={(e) =>
                setPricing((s) => ({ ...s, retainer: priceFromInput(e.target.value) }))
              }
            />
          </div>
        </div>
      )}

      {/* STEP 5 — Mensagem */}
      {step === 4 && (
        <div className="wizard__body">
          <h2 className="tx-h2">Mensagem opcional</h2>
          <p className="body-m" style={{ color: "var(--ink-3)" }}>
            Linha de abertura do slide 1. Em branco usa o nome da empresa.
          </p>
          <div className="field">
            <label>Mensagem</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Proposta para ${prospect?.company_name ?? "{empresa}"}`}
            />
          </div>
        </div>
      )}

      {/* STEP 6 — Revisão */}
      {step === 5 && (
        <div className="wizard__body">
          <h2 className="tx-h2">Pronto para gerar?</h2>
          <div className="card">
            <div className="card__head">
              <h3 className="tx-h3">Resumo</h3>
              <span className="mono body-s" style={{ color: "var(--ink-3)" }}>
                CONFIRMAÇÃO
              </span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 1.7 }}>
              <li>
                <b>Tier:</b> {TIER_OPTIONS.find((t) => t.value === tier)?.label}
              </li>
              <li>
                <b>Empresa:</b> {prospect?.company_name}
              </li>
              <li>
                <b>Prompts:</b> {prompts.length} ({prompts.length * ENGINE_COUNT} chamadas LLM)
              </li>
              <li>
                <b>Pricing:</b>{" "}
                {pricing.diagnostico != null ? `${pricing.diagnostico}€` : "Sob consulta"} /{" "}
                {pricing.sprint != null ? `${pricing.sprint}€` : "Sob consulta"} /{" "}
                {pricing.retainer != null ? `${pricing.retainer}€` : "Sob consulta"}
              </li>
              <li>
                <b>Mensagem:</b>{" "}
                {message || <i style={{ color: "var(--ink-3)" }}>default</i>}
              </li>
            </ul>
          </div>
          <p className="body-s" style={{ color: "var(--ink-3)" }}>
            Ao confirmar, a proposta fica criada com estado <b>draft</b> e a auditoria GEO
            inicia-se em background. Podes acompanhar o progresso na página de detalhe.
          </p>
        </div>
      )}

      {error && (
        <div
          className="card"
          style={{ borderColor: "var(--red)", color: "var(--red)", marginTop: 16, padding: 14 }}
        >
          {error}
        </div>
      )}

      <div className="wizard__foot">
        {step > 0 ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setStep(((step as number) - 1) as StepKey)}
          >
            ← Anterior
          </button>
        ) : (
          <span />
        )}

        {step < 5 ? (
          <button
            type="button"
            className="btn"
            disabled={!canNext}
            onClick={() => setStep(((step as number) + 1) as StepKey)}
          >
            Seguinte →
          </button>
        ) : (
          <button type="button" className="btn-big" disabled={submitting} onClick={submit}>
            <span>{submitting ? "A criar…" : "Criar e iniciar auditoria"}</span>
            <span className="arrow">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
