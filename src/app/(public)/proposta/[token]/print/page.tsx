import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { DeckPrint } from "@/components/deck/DeckPrint";
import type { DeckData } from "@/components/deck/types";
import type { AuditResults, AuditRun, AuditTier, Proposal, Prospect } from "@/lib/supabase/types";
import { loadCoreBenchmarks } from "@/lib/skill/benchmarks";
import { loadMethod } from "@/lib/skill/method";
import type { ScanResult } from "@/lib/scan/types";
import type { SynthesizedDeck } from "@/lib/llm/synthesize-deck";

// Rota só consumida pelo gerador de PDF (chromium headless via download-pdf).
// noindex,nofollow — nunca indexável. force-dynamic: dados sempre frescos.
export const metadata: Metadata = {
  title: "Proposta (print)",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

// NB: bloco de carregamento de DeckData espelhado de page.tsx + download-pdf.
// Mantido isolado de propósito (zero risco para o deck web ao vivo). Dedup
// futura para src/lib/deck/load-deck-data.ts quando o print-to-PDF estabilizar.
export default async function DeckPrintPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const supabase = createServiceClient();

  const { data: proposalRow } = await supabase
    .from("proposals")
    .select("*")
    .eq("token", token)
    .is("deleted_at", null)
    .single();

  if (!proposalRow) notFound();
  const proposal = proposalRow as Proposal;
  if (proposal.audit_status !== "completed") notFound();

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

  const { items: benchmarks } = await loadCoreBenchmarks();
  const { method } = await loadMethod();

  const { data: scanRow } = await supabase
    .from("sinal_scans")
    .select("scan_results")
    .eq("proposal_id", proposal.id)
    .maybeSingle();
  const sinalScan = (scanRow?.scan_results as ScanResult | null) ?? null;

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
    auditRuns,
    benchmarks,
    method,
    sinalScan,
    synthesized: (proposal.deck_blocks as SynthesizedDeck | null) ?? null,
  };

  return <DeckPrint deck={deck} />;
}
