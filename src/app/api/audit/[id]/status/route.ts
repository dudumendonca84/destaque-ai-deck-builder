import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ENGINES } from "@/lib/llm/models";
import { expandEngineModes, FALLBACK_AUGMENTATION } from "@/lib/skill/searchModes";

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
    .select("audit_status,audit_started_at,audit_completed_at,audit_results,custom_prompts")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Progresso: nº de audit_runs gravados / total esperado. Desde o
  // contrato two-mode, cada prompt gera (engine × mode) rows — 10 por
  // prompt com o set actual (6 knowledge + 4 augmented), não 6. Usamos
  // a tabela fallback (sync); se a skill divergir o erro é cosmético e
  // o Math.min(99) protege o overflow.
  const callsPerPrompt = expandEngineModes([...ENGINES], FALLBACK_AUGMENTATION).length;
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
