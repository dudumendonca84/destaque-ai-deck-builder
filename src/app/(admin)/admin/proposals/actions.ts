"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { newProposalToken } from "@/lib/utils/tokens";

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

  // A auditoria GEO é iniciada pela página de detalhe (client-driven via
  // /api/audit/start) — mais robusto em ambiente serverless do que um
  // fire-and-forget aqui, que seria cancelado quando a action retorna.

  revalidatePath("/admin/proposals");
  return { ok: true, id: data.id, token: data.token };
}
