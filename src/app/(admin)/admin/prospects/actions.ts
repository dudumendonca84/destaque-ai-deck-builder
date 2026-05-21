"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseCompetitors, prospectSchema } from "@/lib/validators";
import type { ProspectStatus } from "@/lib/supabase/types";

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
  return {};
}

export async function deleteProspect(id: string) {
  const supabase = await createClient();
  await supabase.from("prospects").delete().eq("id", id);
  revalidatePath("/admin/prospects");
  redirect("/admin/prospects");
}
