"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/site";

const schema = z.object({
  email: z.string().email("Email inválido"),
});

export type LoginState = {
  ok?: boolean;
  error?: string;
};

export async function requestMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Email inválido" };
  }

  if (parsed.data.email.toLowerCase().trim() !== ADMIN_EMAIL.toLowerCase().trim()) {
    return { error: "Este email não tem acesso." };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { error: error.message };
  return { ok: true };
}
