import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Subdomain `proposta.destaque.ai` serve o deck público em URL clean,
// sem o prefix `/proposta/`. Quando o host é o subdomain e o path
// começa em `/<token>` (não nas rotas internas / admin / api), reescreve
// internamente para `/proposta/<token>` que é a rota real.
const PROPOSAL_SUBDOMAIN = "proposta.destaque.ai";

function isCleanTokenPath(pathname: string): boolean {
  // Aceita /<token> ou /<token>/agendar /<token>/expired. Rejeita
  // rotas internas (admin, api, auth, _next, etc.).
  if (pathname === "/") return false;
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/proposta") ||
    pathname.startsWith("/favicon")
  ) {
    return false;
  }
  return true;
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (host.startsWith(PROPOSAL_SUBDOMAIN) && isCleanTokenPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/proposta${request.nextUrl.pathname}`;
    return NextResponse.rewrite(url);
  }
  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
