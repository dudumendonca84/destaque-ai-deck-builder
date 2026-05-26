"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseCompetitors, prospectSchema } from "@/lib/validators";
import type { ProspectStatus } from "@/lib/supabase/types";
import { claudeComplete } from "@/lib/llm/anthropic";

function pickFormData(formData: FormData) {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : undefined;
  };
  return {
    company_name: get("company_name") ?? "",
    company_website: get("company_website") ?? "",
    contact_name: get("contact_name") ?? "",
    contact_email: get("contact_email") ?? "",
    contact_role: get("contact_role") ?? "",
    linkedin_url: get("linkedin_url") ?? "",
    business_type: get("business_type") ?? "",
    location: get("location") ?? "",
    target_audience: get("target_audience") ?? "",
    competitors: get("competitors") ?? "",
    notes: get("notes") ?? "",
    source: get("source") ?? "",
    status: (get("status") ?? "lead") as ProspectStatus,
  };
}

function toRowPayload(data: ReturnType<typeof pickFormData>) {
  return {
    company_name: data.company_name,
    company_website: data.company_website || null,
    contact_name: data.contact_name || null,
    contact_email: data.contact_email || null,
    contact_role: data.contact_role || null,
    linkedin_url: data.linkedin_url || null,
    business_type: data.business_type || null,
    location: data.location || null,
    target_audience: data.target_audience || null,
    competitors: parseCompetitors(data.competitors),
    notes: data.notes || null,
    source: data.source || null,
    status: data.status,
  };
}

export type ProspectFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  // Flag para banner "Guardado" no client após save bem-sucedido.
  // Distingue success de initial state (ambos seriam {} de outro modo).
  success?: boolean;
};

export async function createProspect(
  _prev: ProspectFormState,
  formData: FormData,
): Promise<ProspectFormState> {
  const raw = pickFormData(formData);
  const parsed = prospectSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => {
      fieldErrors[i.path.join(".")] = i.message;
    });
    return { error: "Verifica os campos.", fieldErrors };
  }

  const supabase = await createClient();
  const payload = toRowPayload(raw);
  const { data, error } = await supabase
    .from("prospects")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Erro a guardar." };
  }

  revalidatePath("/admin/prospects");
  redirect(`/admin/prospects/${data.id}`);
}

export async function updateProspect(
  id: string,
  _prev: ProspectFormState,
  formData: FormData,
): Promise<ProspectFormState> {
  const raw = pickFormData(formData);
  const parsed = prospectSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((i) => {
      fieldErrors[i.path.join(".")] = i.message;
    });
    return { error: "Verifica os campos.", fieldErrors };
  }

  const supabase = await createClient();
  const payload = toRowPayload(raw);
  const { error } = await supabase.from("prospects").update(payload).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/prospects");
  revalidatePath(`/admin/prospects/${id}`);
  return { success: true };
}

export async function deleteProspect(id: string) {
  const supabase = await createClient();
  await supabase.from("prospects").delete().eq("id", id);
  revalidatePath("/admin/prospects");
  redirect("/admin/prospects");
}

export type DiscoverResult = { csv?: string; error?: string };

export async function discoverCompetitors(input: {
  company_name: string;
  business_type?: string;
  location?: string;
  target_audience?: string;
}): Promise<DiscoverResult> {
  const { company_name, business_type, location, target_audience } = input;
  if (!company_name?.trim()) return { error: "Empresa em falta" };

  const prompt = `Identifica 5 a 8 concorrentes directos da empresa abaixo, no contexto português.

Empresa: ${company_name}
Tipo de negócio: ${business_type ?? "desconhecido"}
Localização: ${location ?? "Portugal"}
Público-alvo: ${target_audience ?? "B2B"}

Regras estritas:
- Devolve APENAS os nomes das empresas separados por vírgula. Sem números, sem URLs, sem texto adicional, sem aspas.
- Foco em concorrentes directos: mesmo serviço, mesmo mercado geográfico (Portugal preferencialmente), mesma escala.
- Inclui players genuinamente activos. Se a categoria for muito nicho, podes incluir 1-2 players adjacentes mas relevantes.
- Não inventes. Se não tens certeza, devolve apenas os que conheces.

Exemplo de output válido: Empresa A, Empresa B, Empresa C, Empresa D, Empresa E`;

  try {
    const { text } = await claudeComplete({ prompt, maxTokens: 200 });
    const cleaned = text.trim().replace(/^["']|["']$/g, "").replace(/\n+/g, ", ");
    if (!cleaned) return { error: "Resposta vazia do modelo" };
    return { csv: cleaned };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao chamar o modelo" };
  }
}
