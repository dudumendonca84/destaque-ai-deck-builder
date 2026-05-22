import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  createClient as createServiceSb,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Pragmatic typing: a tipagem Database genérica do Supabase v2.46 produz `never`
// para algumas tabelas dependendo da resolução de relationships. Em vez de lutar
// contra o generics, usamos `SupabaseClient` (untyped) e validamos / castamos
// os resultados nos call-sites com os tipos exportados em `./types`.

export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll chamado de Server Component — middleware refresca a sessão.
          }
        },
      },
    },
  );
}

export function createServiceClient(): SupabaseClient {
  return createServiceSb(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
