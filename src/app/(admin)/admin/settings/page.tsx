import { Topbar } from "@/components/admin/Topbar";
import { ADMIN_EMAIL, site } from "@/lib/site";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <Topbar crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Settings" }]} />
      <div className="admin-content">
        <h1 className="tx-h1" style={{ marginBottom: 32 }}>
          Settings
        </h1>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card__head">
            <h2 className="tx-h3">Conta</h2>
            <span className="mono body-s" style={{ color: "var(--ink-3)" }}>
              ÚNICO UTILIZADOR
            </span>
          </div>
          <p className="body-m" style={{ color: "var(--ink-2)", margin: 0 }}>
            {ADMIN_EMAIL}
          </p>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card__head">
            <h2 className="tx-h3">Marca</h2>
          </div>
          <p className="body-m" style={{ color: "var(--ink-2)", margin: 0 }}>
            {site.name} · {site.city} · {site.country}
          </p>
        </div>

        <div className="card">
          <div className="card__head">
            <h2 className="tx-h3">Integrações</h2>
          </div>
          <p className="body-s" style={{ color: "var(--ink-3)", margin: 0 }}>
            Variáveis de ambiente são geridas em Vercel · Settings · Environment Variables.
          </p>
        </div>
      </div>
    </>
  );
}
