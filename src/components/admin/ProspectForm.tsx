"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import type { Prospect, ProspectStatus } from "@/lib/supabase/types";
import { discoverCompetitors, type ProspectFormState } from "@/app/(admin)/admin/prospects/actions";

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
}: {
  action: Action;
  prospect?: Partial<Prospect>;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<ProspectFormState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [isDiscovering, startDiscover] = useTransition();

  const v = (k: keyof Prospect): string => {
    const val = prospect?.[k];
    if (val == null) return "";
    if (Array.isArray(val)) return val.join(", ");
    return String(val);
  };

  const err = (k: string) => state.fieldErrors?.[k];

  const handleDiscover = () => {
    const f = formRef.current;
    if (!f) return;
    setDiscoverError(null);
    const getField = (name: string): string =>
      (f.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "";
    const payload = {
      company_name: getField("company_name").trim(),
      business_type: getField("business_type").trim() || undefined,
      location: getField("location").trim() || undefined,
      target_audience: getField("target_audience").trim() || undefined,
    };
    if (!payload.company_name) {
      setDiscoverError("Preenche o nome da empresa primeiro.");
      return;
    }
    startDiscover(async () => {
      const result = await discoverCompetitors(payload);
      if (result.error) {
        setDiscoverError(result.error);
        return;
      }
      const input = f.elements.namedItem("competitors") as HTMLInputElement | null;
      if (input && result.csv) input.value = result.csv;
    });
  };

  return (
    <form ref={formRef} action={formAction} className="wizard__body">
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
          <label
            htmlFor="competitors"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
          >
            <span>Concorrentes (separados por vírgula)</span>
            <button
              type="button"
              onClick={handleDiscover}
              disabled={isDiscovering}
              style={{
                background: "none",
                border: 0,
                padding: 0,
                cursor: isDiscovering ? "wait" : "pointer",
                color: "var(--ink-2)",
                textDecoration: "underline",
                fontFamily: "inherit",
                fontSize: 12,
              }}
            >
              {isDiscovering ? "A descobrir…" : "Descobrir automaticamente"}
            </button>
          </label>
          <input
            id="competitors"
            name="competitors"
            placeholder="Concorrente A, Concorrente B"
            defaultValue={v("competitors")}
          />
          {discoverError && (
            <span className="error">{discoverError}</span>
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
