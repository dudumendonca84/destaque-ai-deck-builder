import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { DeckContainer } from "@/components/deck/DeckContainer";
import type { DeckData } from "@/components/deck/types";
import type { AuditResults, AuditRun, Proposal, Prospect } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Proposta",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DeckPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  // Service role: o `anon` não tem acesso à BD (ver migration 003). O
  // controlo de acesso é o filtro por token, em código de servidor.
  const supabase = createServiceClient();

  const { data: proposalRow } = await supabase
    .from("proposals")
    .select("*")
    .eq("token", token)
    .is("deleted_at", null)
    .single();

  if (!proposalRow) notFound();
  const proposal = proposalRow as Proposal;

  // Expirada → página dedicada. (Server Component: relógio em render é correcto.)
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  if (proposal.expires_at && new Date(proposal.expires_at).getTime() < now) {
    redirect(`/proposta/${token}/expired`);
  }

  // Auditoria ainda não pronta → estado de espera.
  if (proposal.audit_status !== "completed") {
    return (
      <main className="deck-pending">
        <div className="deck-pending__card">
          <span className="pulse-dot" />
          <h1 className="tx-h2">A preparar a tua proposta</h1>
          <p className="body-m" style={{ color: "var(--ink-3)" }}>
            Estamos a correr a auditoria GEO nos quatro motores de IA. Volta dentro de
            alguns minutos — o link mantém-se o mesmo.
          </p>
        </div>
      </main>
    );
  }

  const { data: prospectRow } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", proposal.prospect_id)
    .single();
  const prospect = prospectRow as Prospect | null;

  const { data: runRows } = await supabase
    .from("audit_runs")
    .select("*")
    .eq("proposal_id", proposal.id);
  const auditRuns = (runRows ?? []) as AuditRun[];

  const deck: DeckData = {
    token,
    companyName: prospect?.company_name ?? "a tua marca",
    businessType: prospect?.business_type ?? null,
    location: prospect?.location ?? null,
    customMessage: proposal.custom_message,
    pricing: {
      diagnostico: proposal.pricing_diagnostico,
      sprint: proposal.pricing_sprint,
      retainer: proposal.pricing_retainer,
    },
    prompts: proposal.custom_prompts ?? [],
    competitors: prospect?.competitors ?? [],
    audit: (proposal.audit_results as AuditResults | null) ?? null,
    auditRuns,
  };

  return <DeckContainer deck={deck} />;
}
