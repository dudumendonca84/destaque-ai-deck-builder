import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";
import { site } from "@/lib/site";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div style={{ marginBottom: 28 }}>
          <Logo size={28} />
          <div className="admin-sidebar__role" style={{ marginTop: 4 }}>
            Deck Builder · Admin
          </div>
        </div>
        <h1>Entrar</h1>
        <p className="body-m" style={{ color: "var(--ink-3)" }}>
          Acesso restrito ao administrador. Receberás um magic link por email.
        </p>
        <LoginForm />
        <div className="foot">
          {site.name} · {site.city}
        </div>
      </div>
    </main>
  );
}
