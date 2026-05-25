import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/admin/Topbar";
import { AuditRunner } from "@/components/admin/AuditRunner";
import { SendProposalButton } from "@/components/admin/SendProposalButton";
import { SynthesizeDeckButton } from "@/components/admin/SynthesizeDeckButton";
import { createClient } from "@/lib/supabase/server";
import type { AuditStatus } from "@/lib/supabase/types";

export const metadata = { title: "Proposta" };

export default async function ProposalDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: proposal } = await supabase
    .from("proposals")
    .select("*, prospects(company_name,business_type,location)")
    .eq("id", id)
    .single();

  if (!proposal) notFound();

  const prospect = Array.isArray(proposal.prospects)
    ? (proposal.prospects[0] as {
        company_name?: string;
        business_type?: string;
        location?: string;
      } | undefined)
    : (proposal.prospects as {
        company_name?: string;
        business_type?: string;
        location?: string;
      } | null);

  // URL clean: o subdomain proposta.destaque.ai serve directamente
  // /{token} via middleware rewrite para /proposta/{token}. Não duplicar
  // o prefix no URL público.
  const base = (process.env.NEXT_PUBLIC_PROPOSAL_URL ?? "").replace(/\/$/, "");
  const publicUrl = `${base}/${proposal.token}`;

  return (
    <>
      <Topbar
        crumbs={[
          { label: "Propostas", href: "/admin/proposals" },
          { label: prospect?.company_name ?? proposal.token },
        ]}
        actions={
          <a className="btn" href={publicUrl} target="_blank" rel="noreferrer">
            Abrir deck →
          </a>
        }
      />
      <div className="admin-content">
        <div className="v2-eyebrow">
          <span className="num">PR</span>
          <span className="bar" />
          <span>Proposta · {proposal.token}</span>
        </div>
        <h1 className="tx-h1" style={{ marginBottom: 12 }}>
          {prospect?.company_name ?? "—"}
        </h1>
        <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 24 }}>
          {prospect?.business_type ?? "—"} · {prospect?.location ?? "—"}
        </p>

        <div style={{ marginBottom: 32 }}>
          <AuditRunner
            proposalId={proposal.id}
            initialStatus={proposal.audit_status as AuditStatus}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div className="kpi">
            <div className="kpi__label">Estado proposta</div>
            <div className="kpi__value" style={{ fontSize: 24 }}>
              {proposal.status}
            </div>
          </div>
          <div className="kpi">
            <div className="kpi__label">Auditoria</div>
            <div className="kpi__value" style={{ fontSize: 24 }}>
              {proposal.audit_status}
            </div>
          </div>
          <div className="kpi">
            <div className="kpi__label">Prompts</div>
            <div className="kpi__value">{proposal.custom_prompts.length}</div>
          </div>
          <div className="kpi">
            <div className="kpi__label">Expira</div>
            <div className="kpi__value" style={{ fontSize: 24 }}>
              {proposal.expires_at
                ? new Date(proposal.expires_at).toLocaleDateString("pt-PT")
                : "—"}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card__head">
            <h2 className="tx-h3">URL pública</h2>
            <Link className="link-arrow" href={`/admin/proposals/${id}/analytics`}>
              Analytics <span>→</span>
            </Link>
          </div>
          <code
            style={{
              fontFamily: "var(--font-mono-jetbrains)",
              fontSize: 13,
              display: "block",
              marginBottom: 16,
            }}
          >
            {publicUrl}
          </code>
          <SendProposalButton
            proposalId={proposal.id}
            alreadySent={Boolean(proposal.sent_at)}
          />
          <SynthesizeDeckButton
            proposalId={proposal.id}
            hasExisting={Boolean(proposal.deck_blocks)}
            synthesizedAt={proposal.deck_synthesized_at}
            source={proposal.deck_synthesized_source}
          />
          {proposal.sent_at && (
            <p className="body-s" style={{ color: "var(--ink-3)", marginTop: 10 }}>
              Enviada a {new Date(proposal.sent_at).toLocaleString("pt-PT")}.
            </p>
          )}
        </div>

        <div className="card">
          <div className="card__head">
            <h2 className="tx-h3">Prompts</h2>
            <Link className="link-arrow" href={`/admin/proposals/${id}/audit`}>
              Ver auditoria <span>→</span>
            </Link>
          </div>
          <ol style={{ paddingLeft: 20, color: "var(--ink-2)" }}>
            {(proposal.custom_prompts as string[]).map((p: string, i: number) => (
              <li key={i} style={{ marginBottom: 8 }}>
                {p}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}
