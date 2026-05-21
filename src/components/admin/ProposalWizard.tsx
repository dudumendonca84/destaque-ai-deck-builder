"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Prospect } from "@/lib/supabase/types";
import { createProposal } from "@/app/(admin)/admin/proposals/actions";
import { fallbackPrompts } from "@/lib/llm/fallback-prompts";

const STEPS = [
  { n: "01", label: "Prospect" },
  { n: "02", label: "Prompts" },
  { n: "03", label: "Pricing" },
  { n: "04", label: "Mensagem" },
  { n: "05", label: "Revisão" },
] as const;

type StepKey = 0 | 1 | 2 | 3 | 4;

type Pricing = {
  diagnostico: number;
  sprint: number;
  retainer: number;
};

export function ProposalWizard({
  prospects,
  initialProspectId,
}: {
  prospects: Pick<Prospect, "id" | "company_name" | "business_type" | "location" | "target_audience" | "competitors">[];
  initialProspectId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<StepKey>(0);
  const [prospectId, setProspectId] = useState<string>(initialProspectId ?? "");
  const [prompts, setPrompts] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [pricing, setPricing] = useState<Pricing>({
    diagnostico: 4500,
    sprint: 18000,
    retainer: 4500,
  });
  const [message, setMessage] = useState<string>("");
  const [submitting, startSubmit] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const prospect = useMemo(
    () => prospects.find((p) => p.id === prospectId) ?? null,
    [prospectId, prospects],
  );

  // Pré-popular prompts via fallback quando o prospect muda — só uma vez.
  useEffect(() => {
    if (!prospect) return;
    if (prompts.length > 0) return;
    setPrompts(
      fallbackPrompts({
        business_type: prospect.business_type,
        location: prospect.location,
        company_name: prospect.company_name,
        target_audience: prospect.target_audience,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospect?.id]);

  const canNext = (() => {
    if (step === 0) return Boolean(prospectId);
    if (step === 1) return prompts.length >= 3 && prompts.every((p) => p.trim().length >= 3);
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
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { prompts?: string[] };
      if (Array.isArray(data.prompts) && data.prompts.length >= 3) {
        setPrompts(data.prompts.slice(0, 7));
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
    startSubmit(async () => {
      const result = await createProposal({
        prospect_id: prospectId,
        custom_prompts: prompts.map((p) => p.trim()).filter(Boolean),
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

      {/* STEP 1 — Prospect */}
      {step === 0 && (
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
              onChange={(e) => setProspectId(e.target.value)}
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

      {/* STEP 2 — Prompts */}
      {step === 1 && (
        <div className="wizard__body">
          <h2 className="tx-h2">5 prompts da <em className="mark">auditoria</em></h2>
          <p className="body-m" style={{ color: "var(--ink-3)" }}>
            Estes são os prompts que vamos correr em ChatGPT, Claude, Gemini e Perplexity.
            Edita-os à vontade — entre 3 e 7 prompts.
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
              disabled={prompts.length >= 7}
            >
              + Adicionar prompt
            </button>
          </div>

          <div className="prompt-list">
            {prompts.map((p, i) => (
              <div className="prompt-row" key={i}>
                <span className="idx">0{i + 1}</span>
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
                  disabled={prompts.length <= 3}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
          <div className="prompt-summary">
            <span>{prompts.length} prompts</span>
            <span style={{ marginLeft: "auto" }}>3-7 prompts · 4 motores · {prompts.length * 4} chamadas</span>
          </div>
        </div>
      )}

      {/* STEP 3 — Pricing */}
      {step === 2 && (
        <div className="wizard__body">
          <h2 className="tx-h2">Pricing da proposta</h2>
          <p className="body-m" style={{ color: "var(--ink-3)" }}>
            Valores em euros. Estes números aparecem nos slides de pricing.
          </p>
          <div className="row-2">
            <div className="field">
              <label>Diagnóstico (€)</label>
              <input
                type="number"
                value={pricing.diagnostico}
                onChange={(e) =>
                  setPricing((s) => ({ ...s, diagnostico: parseInt(e.target.value || "0", 10) }))
                }
              />
            </div>
            <div className="field">
              <label>Sprint (€)</label>
              <input
                type="number"
                value={pricing.sprint}
                onChange={(e) =>
                  setPricing((s) => ({ ...s, sprint: parseInt(e.target.value || "0", 10) }))
                }
              />
            </div>
          </div>
          <div className="field" style={{ maxWidth: 280 }}>
            <label>Retainer (€/mês)</label>
            <input
              type="number"
              value={pricing.retainer}
              onChange={(e) =>
                setPricing((s) => ({ ...s, retainer: parseInt(e.target.value || "0", 10) }))
              }
            />
          </div>
        </div>
      )}

      {/* STEP 4 — Mensagem */}
      {step === 3 && (
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

      {/* STEP 5 — Revisão */}
      {step === 4 && (
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
                <b>Empresa:</b> {prospect?.company_name}
              </li>
              <li>
                <b>Prompts:</b> {prompts.length} ({prompts.length * 4} chamadas LLM)
              </li>
              <li>
                <b>Pricing:</b> {pricing.diagnostico}€ / {pricing.sprint}€ / {pricing.retainer}€
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

        {step < 4 ? (
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
