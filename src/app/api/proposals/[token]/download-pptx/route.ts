import { createClient } from "@/lib/supabase/server";
import { buildPptx } from "@/lib/pptx/build-deck";
import type { DeckData } from "@/components/deck/types";
import type { AuditResults, AuditRun, Proposal, Prospect } from "@/lib/supabase/types";

// pptxgenjs precisa do runtime Node (APIs de Buffer/zip).
export const runtime = "nodejs";

function slug(s: string): string {
  // NFD separa acentos em marcas combinatórias não-ASCII; o filtro
  // [^a-zA-Z0-9] remove-as logo a seguir.
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
  const supabase = await createClient();

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
    auditRuns: (runRows ?? []) as AuditRun[],
  };

  const buffer = await buildPptx(deck);
  const filename = `proposta-${slug(deck.companyName)}.pptx`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
