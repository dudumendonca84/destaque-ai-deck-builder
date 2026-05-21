"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { newProposalToken } from "@/lib/utils/tokens";
import { proposalWizardSchema } from "@/lib/validators";

const PAYLOAD = z.object({
  prospect_id: z.string().uuid(),
  custom_prompts: z.array(z.string().min(3)).min(3).max(7),
  custom_message: z.string().optional().nullable(),
  pricing_diagnostico: z.number().int().min(0).default(4500),
  pricing_sprint: z.number().int().min(0).default(18000),
  pricing_retainer: z.number().int().min(0).default(4500),
});

export type CreateProposalResult = { ok: true; id: string; token: string } | { ok: false; error: string };

export async function createProposal(input: unknown): Promise<CreateProposalResult> {
  const parsed = PAYLOAD.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const token = newProposalToken();
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      prospect_id: parsed.data.prospect_id,
      token,
      custom_prompts: parsed.data.custom_prompts,
      custom_message: parsed.data.custom_message ?? null,
      pricing_diagnostico: parsed.data.pricing_diagnostico,
      pricing_sprint: parsed.data.pricing_sprint,
      pricing_retainer: parsed.data.pricing_retainer,
      audit_status: "pending",
      status: "draft",
      expires_at: expires.toISOString(),
    })
    .select("id,token")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Erro a criar proposta." };
  }

  // Fire-and-forget para iniciar auditoria em background (Step 10).
  // O endpoint /api/audit/start ainda está stub e será implementado depois.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    await fetch(`${appUrl}/api/audit/start`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ proposal_id: data.id }),
      cache: "no-store",
    });
  } catch {
    // ignorado — pode ser disparado manualmente da página de detalhe.
  }

  revalidatePath("/admin/proposals");
  return { ok: true, id: data.id, token: data.token };
}
