"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AuditPrompt, AuditTier } from "@/lib/supabase/types";

export type AuditActionResult = { ok: true } | { ok: false; error: string };

async function adminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");
  return supabase;
}

/** Define o tier da auditoria da proposta (gratuita = 5 / diagnóstico = 30). */
export async function setAuditTier(
  proposalId: string,
  tier: AuditTier,
): Promise<AuditActionResult> {
  try {
    const supabase = await adminClient();
    const { error } = await supabase
      .from("proposals")
      .update({ audit_tier: tier })
      .eq("id", proposalId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/proposals/${proposalId}/audit`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado." };
  }
}

/** Persiste o array de prompts (edições inline incluídas) em audit_runs.prompts. */
export async function saveAuditPrompts(
  proposalId: string,
  prompts: AuditPrompt[],
): Promise<AuditActionResult> {
  try {
    const supabase = await adminClient();
    const { error } = await supabase
      .from("audit_runs")
      .upsert({ proposal_id: proposalId, prompts }, { onConflict: "proposal_id" });
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/proposals/${proposalId}/audit`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado." };
  }
}
