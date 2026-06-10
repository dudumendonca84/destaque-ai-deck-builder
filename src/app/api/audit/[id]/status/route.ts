import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ENGINES } from "@/lib/llm/models";
import { WEB_SEARCH_CAPABLE, webSearchEnabledForTier } from "@/lib/llm/web-search";
import type { AuditTier } from "@/lib/supabase/types";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("proposals")
    .select("audit_status,audit_started_at,audit_completed_at,audit_results,custom_prompts,audit_tier")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Two-mode: cada prompt gera knowledge + augmented por motor capaz; só
  // knowledge para motores sem search nativo. Usa WEB_SEARCH_CAPABLE (sync,
  // sem fetch à skill) — drift face ao MD canónico é cosmético e o
  // Math.min(99) protege qualquer overflow. O gate por tier respeita
  // AUDIT_WEB_SEARCH_TIERS para não mostrar progresso "vazio".
  const tier = (data.audit_tier as AuditTier | undefined) ?? "free";
  const tierAllowsAugmented = webSearchEnabledForTier(tier);
  const callsPerPrompt = ENGINES.reduce((sum, engine) => {
    const grounded = (WEB_SEARCH_CAPABLE[engine] ?? false) && tierAllowsAugmented;
    return sum + 1 + (grounded ? 1 : 0); // 1 row knowledge + (1 augmented se aplicável)
  }, 0);
  const expected = (data.custom_prompts?.length ?? 0) * callsPerPrompt;
  const { count } = await supabase
    .from("audit_runs")
    .select("*", { count: "exact", head: true })
    .eq("proposal_id", id);

  let progress_percent: number;
  if (data.audit_status === "completed") progress_percent = 100;
  else if (data.audit_status === "failed" || expected === 0) progress_percent = 0;
  else progress_percent = Math.min(99, Math.round(((count ?? 0) / expected) * 100));

  return NextResponse.json({
    status: data.audit_status,
    progress_percent,
    audit_results: data.audit_results ?? null,
  });
}
