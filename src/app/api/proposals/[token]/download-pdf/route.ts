import { createServiceClient } from "@/lib/supabase/server";
import { buildPdf } from "@/lib/pdf/build-deck";
import type { DeckData } from "@/components/deck/types";
import type {
  AuditResults,
  AuditRun,
  AuditTier,
  Proposal,
  Prospect,
} from "@/lib/supabase/types";
import { loadCoreBenchmarks } from "@/lib/skill/benchmarks";

// @react-pdf/renderer precisa do runtime Node.
export const runtime = "nodejs";

function slug(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "proposta"
  );
}

export async function GET(_request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  // Service role: público por token (ver migration 003).
  const supabase = createServiceClient();

  const { data: proposalRow } = await supabase
    .from("proposals")
    .select("*")
    .eq("token", token)
    .is("deleted_at", null)
    .single();

  if (!proposalRow) {
    return new Response("Proposta não encontrada", { status: 404 });
  }
  const proposal = proposalRow as Proposal;

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

  const { items: benchmarks } = await loadCoreBenchmarks();

  const deck: DeckData = {
    token,
    companyName: prospect?.company_name ?? "a tua marca",
    businessType: prospect?.business_type ?? null,
    location: prospect?.location ?? null,
    customMessage: proposal.custom_message,
    auditTier: (proposal.audit_tier as AuditTier | undefined) ?? "free",
    pricing: {
      diagnostico: proposal.pricing_diagnostico,
      sprint: proposal.pricing_sprint,
      retainer: proposal.pricing_retainer,
    },
    prompts: proposal.custom_prompts ?? [],
    competitors: prospect?.competitors ?? [],
    audit: (proposal.audit_results as AuditResults | null) ?? null,
    auditRuns: (runRows ?? []) as AuditRun[],
    benchmarks,
  };

  const buffer = await buildPdf(deck);
  const filename = `proposta-${slug(deck.companyName)}.pdf`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
