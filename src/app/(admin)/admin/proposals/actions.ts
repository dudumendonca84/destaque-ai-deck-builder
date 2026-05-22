"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { newProposalToken } from "@/lib/utils/tokens";
import { sendProposalEmail } from "@/lib/email/resend";
import { site } from "@/lib/site";

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

export type SendProposalResult = { ok: true; to: string } | { ok: false; error: string };

/** Envia a proposta por email ao prospect e marca o estado como `sent`. */
export async function sendProposal(proposalId: string): Promise<SendProposalResult> {
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id,token,status,prospect_id")
    .eq("id", proposalId)
    .single();

  if (!proposal) return { ok: false, error: "Proposta não encontrada." };

  const { data: prospect } = await supabase
    .from("prospects")
    .select("company_name,contact_name,contact_email")
    .eq("id", proposal.prospect_id)
    .single();

  if (!prospect?.contact_email) {
    return {
      ok: false,
      error: "O prospect não tem email de contacto. Adiciona-o na ficha do prospect.",
    };
  }

  const base = process.env.NEXT_PUBLIC_PROPOSAL_URL ?? site.url;
  const proposalUrl = `${base.replace(/\/$/, "")}/proposta/${proposal.token}`;

  try {
    await sendProposalEmail({
      to: prospect.contact_email,
      companyName: prospect.company_name,
      contactName: prospect.contact_name,
      proposalUrl,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha no envio." };
  }

  await supabase
    .from("proposals")
    .update({
      status: proposal.status === "draft" ? "sent" : proposal.status,
      sent_at: new Date().toISOString(),
    })
    .eq("id", proposalId);

  revalidatePath(`/admin/proposals/${proposalId}`);
  return { ok: true, to: prospect.contact_email };
}
