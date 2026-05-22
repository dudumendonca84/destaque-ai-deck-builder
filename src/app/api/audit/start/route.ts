import { NextResponse } from "next/server";
import { z } from "zod";
import { runAudit } from "@/lib/llm/run-audit";
import { createClient } from "@/lib/supabase/server";

// A auditoria pode demorar (prompts × 4 motores × parsing). Em Vercel,
// maxDuration estende o tempo da função serverless.
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

  try {
    await runAudit(parsed.data.proposal_id);
    return NextResponse.json({ ok: true, status: "completed" });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "audit_failed" },
      { status: 500 },
    );
  }
}
