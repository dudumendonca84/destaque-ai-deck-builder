import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePrompts } from "@/lib/llm/generate-prompts";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const schema = z.object({
  business_type: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
  target_audience: z.string().optional().nullable(),
  competitors: z.array(z.string()).optional().nullable(),
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

  const result = await generatePrompts({
    business_type: parsed.data.business_type ?? undefined,
    location: parsed.data.location ?? undefined,
    company_name: parsed.data.company_name ?? undefined,
    target_audience: parsed.data.target_audience ?? undefined,
    competitors: parsed.data.competitors ?? undefined,
  });

  return NextResponse.json(result);
}
