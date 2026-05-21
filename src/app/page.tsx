import Link from "next/link";
import { Logo } from "@/components/Logo";
import { site } from "@/lib/site";

export default function RootPage() {
  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div style={{ marginBottom: 28 }}>
          <Logo size={28} />
        </div>
        <h1>Deck Builder</h1>
        <p className="body-m" style={{ color: "var(--ink-3)" }}>
          Plataforma interna de propostas e auditorias GEO. Acesso restrito.
        </p>
        <Link className="btn-big" href="/admin">
          <span>Entrar</span>
          <span className="arrow">→</span>
        </Link>
        <div className="foot">
          {site.name} · {site.city}
        </div>
      </div>
    </main>
  );
}
