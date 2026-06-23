"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/site";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Password mínimo 6 caracteres"),
});

export type LoginState = {
  ok?: boolean;
  error?: string;
};

/**
 * Password sign-in. Restringido ao ADMIN_EMAIL — qualquer outra conta no
 * mesmo projecto Supabase (ex: o user do Tracker) consegue autenticar via
 * Supabase mas é rejeitada aqui antes de receber sessão admin. Garante
 * que o /admin do deck só serve o operador, independentemente de quem
 * tem conta no projecto.
 */
export async function signInWithPassword(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Inválido" };
  }

  if (parsed.data.email.toLowerCase().trim() !== ADMIN_EMAIL.toLowerCase().trim()) {
    return { error: "Este email não tem acesso." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: error.message };
  return { ok: true };
}
