import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { synthesizeDeck } from "@/lib/llm/synthesize-deck";
import type {
  AuditResults,
  AuditRun,
  Proposal,
  Prospect,
} from "@/lib/supabase/types";
import type { ScanResult } from "@/lib/scan/types";

// Step 12 — Claude sintetiza o deck com a skill inteira + audit + scan.
// Pode demorar ~30-60s (Claude call grande). Vercel maxDuration:
export const maxDuration = 120;

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Service client para ler relations sem RLS bloquear.
  const sb = createServiceClient();

  const { data: proposalRow } = await sb
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();
  if (!proposalRow) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const proposal = proposalRow as Proposal;

  const { data: prospectRow } = await sb
    .from("prospects")
    .select("*")
    .eq("id", proposal.prospect_id)
    .single();
  const prospect = prospectRow as Prospect | null;

  const { data: runRows } = await sb
    .from("audit_runs")
    .select("*")
    .eq("proposal_id", id);
  const auditRuns = (runRows ?? []) as AuditRun[];

  const { data: scanRow } = await sb
    .from("sinal_scans")
    .select("scan_results")
    .eq("proposal_id", id)
    .maybeSingle();
  const sinalScan = (scanRow?.scan_results as ScanResult | null) ?? null;

  const { deck, source } = await synthesizeDeck({
    brandName: prospect?.company_name ?? "a marca",
    businessType: prospect?.business_type ?? null,
    location: prospect?.location ?? null,
    targetAudience: prospect?.target_audience ?? null,
    competitors: prospect?.competitors ?? [],
    audit: (proposal.audit_results as AuditResults | null) ?? null,
    auditRuns,
    sinalScan,
  });

  const { error: updateError } = await sb
    .from("proposals")
    .update({
      deck_blocks: deck,
      deck_synthesized_at: new Date().toISOString(),
      deck_synthesized_source: source,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { ok: false, error: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, source, deck });
}
