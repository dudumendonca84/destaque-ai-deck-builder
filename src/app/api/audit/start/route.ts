import { NextResponse, after } from "next/server";
import { z } from "zod";
import { runAudit } from "@/lib/llm/run-audit";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Vercel maxDuration. A audit corre em background via `after()` — o
// response volta imediatamente para o client, evitando timeouts edge.
export const maxDuration = 300;

const schema = z.object({ proposal_id: z.string().uuid() });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const proposalId = parsed.data.proposal_id;

  // Marca como running imediatamente para o client UI mostrar progresso
  // sem latência. Service client para não depender do auth do user.
  const sb = createServiceClient();
  await sb
    .from("proposals")
    .update({ audit_status: "running", audit_started_at: new Date().toISOString() })
    .eq("id", proposalId);

  // Audit corre em background. Não bloqueia o response. Quando termina,
  // grava audit_status e audit_results na DB; o client descobre via poll
  // ao /api/audit/[id]/status.
  after(async () => {
    try {
      await runAudit(proposalId);
    } catch {
      await sb
        .from("proposals")
        .update({ audit_status: "failed" })
        .eq("id", proposalId);
    }
  });

  return NextResponse.json({ ok: true, status: "running" });
}
