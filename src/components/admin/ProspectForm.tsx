"use client";

import { useActionState } from "react";
import type { Prospect, ProspectStatus } from "@/lib/supabase/types";
import type { ProspectFormState } from "@/app/(admin)/admin/prospects/actions";

const STATUSES: ProspectStatus[] = [
  "lead",
  "contacted",
  "opened",
  "replied",
  "scheduled",
  "won",
  "lost",
];

type Action = (state: ProspectFormState, formData: FormData) => Promise<ProspectFormState>;

export function ProspectForm({
  action,
  prospect,
  submitLabel = "Guardar",
  discoveredCompetitors = [],
  discoveredAt = null,
}: {
  action: Action;
  prospect?: Partial<Prospect>;
  submitLabel?: string;
  /** Top competitors organicamente mencionados pelos LLMs no último audit
   * completo deste prospect. Fonte canónica da realidade competitiva — o
   * campo `competitors` no form é apenas um seed para o parser. */
  discoveredCompetitors?: string[];
  discoveredAt?: string | null;
}) {
  const [state, formAction, pending] = useActionState<ProspectFormState, FormData>(action, {});

  const v = (k: keyof Prospect): string => {
    const val = prospect?.[k];
    if (val == null) return "";
    if (Array.isArray(val)) return val.join(", ");
    return String(val);
  };

  const err = (k: string) => state.fieldErrors?.[k];

  return (
    <form action={formAction} className="wizard__body">
      <div className="row-2">
        <div className="field">
          <label htmlFor="company_name">Empresa *</label>
          <input id="company_name" name="company_name" defaultValue={v("company_name")} required />
          {err("company_name") && <span className="error">{err("company_name")}</span>}
        </div>
        <div className="field">
          <label htmlFor="company_website">Website</label>
          <input
            id="company_website"
            name="company_website"
            type="text"
            inputMode="url"
            placeholder="destaque.ai"
            defaultValue={v("company_website")}
          />
          {err("company_website") && <span className="error">{err("company_website")}</span>}
        </div>
      </div>

      <div className="row-2">
        <div className="field">
          <label htmlFor="business_type">Tipo de negócio</label>
          <input
            id="business_type"
            name="business_type"
            placeholder="ex: dentista, SaaS B2B"
            defaultValue={v("business_type")}
          />
        </div>
        <div className="field">
          <label htmlFor="location">Localização</label>
          <input
            id="location"
            name="location"
            placeholder="ex: Braga, Lisboa"
            defaultValue={v("location")}
          />
        </div>
      </div>

      <div className="row-2">
        <div className="field">
          <label htmlFor="target_audience">Público-alvo</label>
          <input
            id="target_audience"
            name="target_audience"
            placeholder="ex: particulares, startups"
            defaultValue={v("target_audience")}
          />
        </div>
        <div className="field">
          <label htmlFor="competitors">Concorrentes conhecidos (opcional)</label>
          <input
            id="competitors"
            name="competitors"
            placeholder="Concorrente A, Concorrente B"
            defaultValue={v("competitors")}
          />
          <span style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>
            Seed para o parser. Os concorrentes <em>reais</em> são descobertos no audit
            via menções dos LLMs.
          </span>
          {discoveredCompetitors.length > 0 && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                background: "var(--paper-2)",
                borderLeft: "3px solid var(--amber, #d97706)",
                fontSize: 13,
              }}
            >
              <strong>Descobertos no audit{discoveredAt ? ` · ${new Date(discoveredAt).toLocaleDateString("pt-PT")}` : ""}:</strong>{" "}
              {discoveredCompetitors.join(", ")}
            </div>
          )}
        </div>
      </div>

      <div className="row-2">
        <div className="field">
          <label htmlFor="contact_name">Contacto</label>
          <input id="contact_name" name="contact_name" defaultValue={v("contact_name")} />
        </div>
        <div className="field">
          <label htmlFor="contact_email">Email contacto</label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={v("contact_email")}
          />
          {err("contact_email") && <span className="error">{err("contact_email")}</span>}
        </div>
      </div>

      <div className="row-2">
        <div className="field">
          <label htmlFor="contact_role">Cargo</label>
          <input id="contact_role" name="contact_role" defaultValue={v("contact_role")} />
        </div>
        <div className="field">
          <label htmlFor="linkedin_url">LinkedIn</label>
          <input
            id="linkedin_url"
            name="linkedin_url"
            type="text"
            inputMode="url"
            placeholder="linkedin.com/in/..."
            defaultValue={v("linkedin_url")}
          />
        </div>
      </div>

      <div className="row-2">
        <div className="field">
          <label htmlFor="source">Origem</label>
          <input
            id="source"
            name="source"
            placeholder="ex: referência, evento"
            defaultValue={v("source")}
          />
        </div>
        <div className="field">
          <label htmlFor="status">Estado</label>
          <select id="status" name="status" defaultValue={v("status") || "lead"}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="notes">Notas</label>
        <textarea id="notes" name="notes" defaultValue={v("notes")} />
      </div>

      {state.error && (
        <div
          className="card"
          style={{ borderColor: "var(--red)", color: "var(--red)", padding: 14 }}
        >
          {state.error}
        </div>
      )}

      {state.success && (
        <div
          className="card"
          role="status"
          style={{
            borderColor: "var(--green, #16a34a)",
            color: "var(--green, #16a34a)",
            padding: 14,
          }}
        >
          Alterações guardadas.
        </div>
      )}

      <div className="wizard__foot">
        <span className="prompt-summary">* obrigatório</span>
        <button type="submit" className="btn-big" disabled={pending}>
          <span>{pending ? "A guardar…" : submitLabel}</span>
          <span className="arrow">→</span>
        </button>
      </div>
    </form>
  );
}
