import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import type { AuditPrompt } from "@/lib/supabase/types";
import { auditConcurrency, executeAudit, type AuditResponseRow } from "./audit-engine";

/**
 * Corre a auditoria GEO completa de uma proposta: prompts × motores configurados.
 *
 * Lê os prompts confirmados de `audit_runs.prompts` (Step 9); para propostas
 * legacy do wizard, cai em `proposals.custom_prompts`. Grava `audit_responses`
 * ligadas ao lote (`audit_run_id`) e popula `audit_results`.
 *
 * O cliente Supabase é injetável para permitir testes sem base de dados real.
 */
export async function runAudit(
  proposalId: string,
  supabase: SupabaseClient = createServiceClient(),
): Promise<void> {
  const startedAt = Date.now();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id,custom_prompts,prospect_id")
    .eq("id", proposalId)
    .single();

  if (!proposal) throw new Error("proposal_not_found");

  const { data: prospect } = await supabase
    .from("prospects")
    .select("company_name,competitors")
    .eq("id", proposal.prospect_id)
    .single();

  // Lote de auditoria v2 — fonte de verdade dos prompts.
  const { data: run } = await supabase
    .from("audit_runs")
    .select("id,prompts")
    .eq("proposal_id", proposalId)
    .maybeSingle();

  const auditRunId: string | null = run?.id ?? null;
  const structured = (run?.prompts as AuditPrompt[] | null) ?? [];
  const prompts: string[] = structured.length
    ? structured.map((p) => p.text)
    : (proposal.custom_prompts ?? []);

  const brandName: string = prospect?.company_name ?? "a marca";
  const competitors: string[] = prospect?.competitors ?? [];

  await supabase
    .from("proposals")
    .update({ audit_status: "running", audit_started_at: new Date().toISOString() })
    .eq("id", proposalId);

  try {
    // Limpa respostas anteriores; o onBatch insere por prompt, para que o
    // endpoint de status reporte progresso incremental.
    await supabase.from("audit_responses").delete().eq("proposal_id", proposalId);

    const { rows, results } = await executeAudit(
      { prompts, brandName, competitors, concurrency: auditConcurrency() },
      async (batch: AuditResponseRow[]) => {
        await supabase.from("audit_responses").insert(
          batch.map((r) => ({
            proposal_id: proposalId,
            audit_run_id: auditRunId,
            prompt: r.prompt,
            engine: r.engine,
            response: r.response,
            citations_found: r.analysis.citations_found,
            brand_position: r.analysis.brand_position,
            brand_present: r.analysis.brand_present,
            competitors_mentioned: r.analysis.competitors_mentioned,
            sentiment_score: r.analysis.sentiment_score,
            tokens_used: r.tokens,
          })),
        );
      },
    );

    await supabase
      .from("proposals")
      .update({
        audit_status: "completed",
        audit_completed_at: new Date().toISOString(),
        audit_results: results,
      })
      .eq("id", proposalId);

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    const tokens = rows.reduce((sum, r) => sum + r.tokens, 0);
    console.log(
      `[run-audit] proposta ${proposalId} · ${rows.length} respostas · ${elapsed}s · ${tokens} tokens`,
    );
  } catch {
    await supabase.from("proposals").update({ audit_status: "failed" }).eq("id", proposalId);
    throw new Error("audit_failed");
  }
}
