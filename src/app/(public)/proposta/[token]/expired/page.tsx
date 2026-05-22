import { Logo } from "@/components/Logo";
import { site } from "@/lib/site";

export const metadata = { title: "Proposta expirada", robots: { index: false } };

export default function ExpiredPage() {
  return (
    <main className="deck-pending">
      <div className="deck-pending__card">
        <Logo size={26} />
        <h1 className="tx-h2" style={{ marginTop: 16 }}>
          Esta proposta <em className="mark">expirou</em>
        </h1>
        <p className="body-m" style={{ color: "var(--ink-3)" }}>
          O link de acesso já não está activo. Fala connosco e preparamos uma versão
          actualizada.
        </p>
        <a className="btn-big" href={`mailto:${site.email}`} style={{ marginTop: 20 }}>
          <span>Contactar destaque.ai</span>
          <span className="arrow">→</span>
        </a>
      </div>
    </main>
  );
}
