import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePrompts } from "@/lib/llm/generate-prompts";
import { generateAuditPrompts } from "@/lib/llm/prompts/generate-audit-prompts";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// Step 9 — input { proposal_id }: gera prompts estruturados pelo tier da
// proposta e persiste-os em audit_runs.prompts.
const step9Schema = z.object({ proposal_id: z.string().uuid() });

// LEGACY: payload do wizard original (ProposalWizard). A remover quando o
// wizard for refeito (Step ~18+).
const legacySchema = z.object({
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

  // --- Step 9: ramo novo, detectado por `proposal_id` ---
  const step9 = step9Schema.safeParse(body);
  if (step9.success) {
    const { data: proposal } = await supabase
      .from("proposals")
      .select(
        "id, audit_tier, prospects(company_name,business_type,location,target_audience,competitors)",
      )
      .eq("id", step9.data.proposal_id)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: "proposal_not_found" }, { status: 404 });
    }

    const prospect = Array.isArray(proposal.prospects)
      ? proposal.prospects[0]
      : proposal.prospects;
    const tier = proposal.audit_tier === "diagnostic" ? "diagnostic" : "free";
    const count = tier === "diagnostic" ? 30 : 5;

    const result = await generateAuditPrompts(
      {
        company_name: prospect?.company_name,
        business_type: prospect?.business_type,
        location: prospect?.location,
        target_audience: prospect?.target_audience,
        competitors: prospect?.competitors,
      },
      count,
    );

    const { data: run, error } = await supabase
      .from("audit_runs")
      .upsert(
        { proposal_id: proposal.id, prompts: result.prompts },
        { onConflict: "proposal_id" },
      )
      .select("id,prompts")
      .single();

    if (error || !run) {
      return NextResponse.json({ error: "persist_failed" }, { status: 500 });
    }

    return NextResponse.json({
      audit_run_id: run.id,
      tier,
      source: result.source,
      prompts: run.prompts,
    });
  }

  // --- LEGACY: ramo do wizard, payload { business_type, ... } ---
  const legacy = legacySchema.safeParse(body);
  if (!legacy.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const result = await generatePrompts({
    business_type: legacy.data.business_type ?? undefined,
    location: legacy.data.location ?? undefined,
    company_name: legacy.data.company_name ?? undefined,
    target_audience: legacy.data.target_audience ?? undefined,
    competitors: legacy.data.competitors ?? undefined,
  });

  return NextResponse.json(result);
}
