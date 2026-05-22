import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

const schema = z.object({
  event_type: z.string().min(1).max(64),
  slide_number: z.number().int().min(0).max(100).optional(),
  slide_id: z.string().max(64).optional(),
  duration_seconds: z.number().int().min(0).max(86400).optional(),
  session_id: z.string().max(64).optional(),
});

export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id,first_viewed_at,status")
    .eq("token", token)
    .is("deleted_at", null)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await supabase.from("proposal_events").insert({
    proposal_id: proposal.id,
    event_type: parsed.data.event_type,
    slide_number: parsed.data.slide_number ?? null,
    slide_id: parsed.data.slide_id ?? null,
    duration_seconds: parsed.data.duration_seconds ?? null,
    session_id: parsed.data.session_id ?? null,
    user_agent: request.headers.get("user-agent"),
    referrer: request.headers.get("referer"),
    ip_country: request.headers.get("x-vercel-ip-country"),
  });

  // Primeira visualização → marca first_viewed_at e promove o estado.
  if (!proposal.first_viewed_at) {
    await supabase
      .from("proposals")
      .update({
        first_viewed_at: new Date().toISOString(),
        status: proposal.status === "sent" || proposal.status === "draft" ? "viewed" : proposal.status,
      })
      .eq("id", proposal.id);
  }

  return NextResponse.json({ ok: true });
}
