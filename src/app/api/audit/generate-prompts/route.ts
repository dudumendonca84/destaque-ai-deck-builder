import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAuditPrompts } from "@/lib/llm/prompts/generate-audit-prompts";
import { createClient } from "@/lib/supabase/server";

// diagnostic tier gera 30 prompts; pode levar até ~1 min com 2 retries.
export const maxDuration = 120;

const schema = z.object({
  business_type: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
  target_audience: z.string().optional().nullable(),
  competitors: z.array(z.string()).optional().nullable(),
  tier: z.enum(["free", "diagnostic", "premium"]).optional(),
});

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

  const result = await generateAuditPrompts({
    business_type: parsed.data.business_type ?? undefined,
    location: parsed.data.location ?? undefined,
    company_name: parsed.data.company_name ?? undefined,
    target_audience: parsed.data.target_audience ?? undefined,
    competitors: parsed.data.competitors ?? undefined,
    tier: parsed.data.tier,
  });

  return NextResponse.json(result);
}
