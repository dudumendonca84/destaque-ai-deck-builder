import { notFound } from "next/navigation";
import { Topbar } from "@/components/admin/Topbar";
import { AuditPromptsEditor } from "@/components/admin/AuditPromptsEditor";
import { createClient } from "@/lib/supabase/server";
import { ENGINE_LABEL, type Engine } from "@/lib/llm/models";
import { pct } from "@/lib/utils/format";
import type {
  AuditPrompt,
  AuditResponse,
  AuditResults,
  AuditTier,
} from "@/lib/supabase/types";

export const metadata = { title: "Auditoria" };

export default async function AuditDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id,token,audit_status,audit_tier,audit_results,prospects(company_name)")
    .eq("id", id)
    .single();

  if (!proposal) notFound();

  const company =
    (Array.isArray(proposal.prospects)
      ? (proposal.prospects[0] as { company_name?: string } | undefined)
      : (proposal.prospects as { company_name?: string } | null)
    )?.company_name ?? proposal.token;

  const { data: run } = await supabase
    .from("audit_runs")
    .select("id,prompts")
    .eq("proposal_id", id)
    .maybeSingle();

  const { data: responseRows } = await supabase
    .from("audit_responses")
    .select("*")
    .eq("proposal_id", id)
    .order("engine");
  const responses = (responseRows ?? []) as AuditResponse[];
  const audit = (proposal.audit_results as AuditResults | null) ?? null;
  const initialPrompts = ((run?.prompts as AuditPrompt[] | null) ?? []) as AuditPrompt[];

  return (
    <>
      <Topbar
        crumbs={[
          { label: "Propostas", href: "/admin/proposals" },
          { label: company, href: `/admin/proposals/${id}` },
          { label: "Auditoria" },
        ]}
      />
      <div className="admin-content">
        <h1 className="tx-h1" style={{ marginBottom: 8 }}>
          Auditoria GEO
        </h1>
        <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 28 }}>
          Estado: <b>{proposal.audit_status}</b> · {responses.length} respostas analisadas
        </p>

        <AuditPromptsEditor
          proposalId={id}
          initialTier={(proposal.audit_tier as AuditTier) ?? "free"}
          initialPrompts={initialPrompts}
        />

        {audit && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
              marginBottom: 36,
            }}
          >
            <div className="kpi">
              <div className="kpi__label">Taxa de citação</div>
              <div className="kpi__value">{pct(audit.summary.citation_rate)}</div>
            </div>
            <div className="kpi">
              <div className="kpi__label">Share of voice</div>
              <div className="kpi__value">{pct(audit.summary.share_of_voice)}</div>
            </div>
            <div className="kpi">
              <div className="kpi__label">Posição média</div>
              <div className="kpi__value">
                {audit.summary.avg_position != null ? `#${audit.summary.avg_position}` : "—"}
              </div>
            </div>
            <div className="kpi">
              <div className="kpi__label">Top concorrente</div>
              <div className="kpi__value" style={{ fontSize: 22 }}>
                {audit.summary.top_competitors[0] ?? "—"}
              </div>
            </div>
          </div>
        )}

        {responses.length === 0 ? (
          <div className="card">
            <p className="body-m" style={{ color: "var(--ink-3)", margin: 0 }}>
              Sem respostas de auditoria. Confirma os prompts e corre a auditoria.
            </p>
          </div>
        ) : (
          responses.map((r) => (
            <div className="audit-run" key={r.id}>
              <div className="audit-run__head">
                <span className="audit-run__engine">
                  {ENGINE_LABEL[r.engine as Engine] ?? r.engine}
                </span>
                <span className="audit-run__prompt">{r.prompt}</span>
                <span className="audit-run__meta">
                  {r.brand_present
                    ? `citada · #${r.brand_position ?? "?"}`
                    : "ausente"}{" "}
                  · sentimento {r.sentiment_score ?? 0}
                </span>
              </div>
              <div className="audit-run__response">{r.response ?? "(sem resposta)"}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
