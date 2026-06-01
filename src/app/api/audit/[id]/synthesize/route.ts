import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Proposal } from "@/lib/supabase/types";

// Step 12 — enfileira a síntese do deck. NÃO chama Claude API aqui: a
// síntese real corre na Routine "Synthesize-pending-decks" do Claude Code
// Web (plano Max, custo zero, think-deeply 30-60min, qualidade 3HASH+).
// Este endpoint só marca a proposta como pending; a Routine processa
// `deck_synthesis_pending = true` no próximo run (manual via "Run now" ou
// cron diário 9:00). Histórico: chamávamos Claude API aqui (Sonnet, sync,
// 120s maxDuration) — duplicava o trabalho da Routine e queimava créditos
// com 504 timeouts em audits grandes. Removido.
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sb = createServiceClient();

  const { data: proposalRow } = await sb
    .from("proposals")
    .select("id,audit_status")
    .eq("id", id)
    .single();
  if (!proposalRow) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const proposal = proposalRow as Pick<Proposal, "id" | "audit_status">;

  // A Routine só processa propostas com audit completo — enfileirar antes
  // disso seria inútil (sem audit_runs para sintetizar).
  if (proposal.audit_status !== "completed") {
    return NextResponse.json(
      { ok: false, error: "Fase 1 (Auditoria GEO) ainda não terminou." },
      { status: 409 },
    );
  }

  const { error: updateError } = await sb
    .from("proposals")
    .update({ deck_synthesis_pending: true })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, queued: true });
}
