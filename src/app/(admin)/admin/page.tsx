import Link from "next/link";
import { Topbar } from "@/components/admin/Topbar";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };

async function getKpis() {
  const supabase = await createClient();
  const [{ count: prospectsCount }, { count: proposalsCount }, { count: viewedCount }, { data: recent }] =
    await Promise.all([
      supabase.from("prospects").select("*", { count: "exact", head: true }),
      supabase.from("proposals").select("*", { count: "exact", head: true }),
      supabase
        .from("proposals")
        .select("*", { count: "exact", head: true })
        .eq("status", "viewed"),
      supabase
        .from("proposals")
        .select("id,token,created_at,status,prospect_id,prospects(company_name)")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  return {
    prospects: prospectsCount ?? 0,
    proposals: proposalsCount ?? 0,
    viewed: viewedCount ?? 0,
    recent: recent ?? [],
  };
}

export default async function DashboardPage() {
  const kpis = await getKpis();

  return (
    <>
      <Topbar
        crumbs={[{ label: "Dashboard" }]}
        actions={
          <Link href="/admin/proposals/new" className="btn">
            Nova proposta →
          </Link>
        }
      />
      <div className="admin-content">
        <div className="v2-eyebrow">
          <span className="num">01</span>
          <span className="bar" />
          <span>Visão geral</span>
        </div>
        <h1 className="tx-h1" style={{ marginBottom: 32 }}>
          Bom dia. <em className="mark">Operação</em>.
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
            marginBottom: 48,
          }}
        >
          <div className="kpi">
            <div className="kpi__label">Prospects</div>
            <div className="kpi__value">{kpis.prospects}</div>
            <div className="kpi__delta">total · pipeline activo</div>
          </div>
          <div className="kpi">
            <div className="kpi__label">Propostas</div>
            <div className="kpi__value">{kpis.proposals}</div>
            <div className="kpi__delta">total · geradas</div>
          </div>
          <div className="kpi">
            <div className="kpi__label">Vistas</div>
            <div className="kpi__value">{kpis.viewed}</div>
            <div className="kpi__delta">propostas abertas pelo prospect</div>
          </div>
        </div>

        <div className="v2-eyebrow">
          <span className="num">02</span>
          <span className="bar" />
          <span>Recentes</span>
        </div>

        {kpis.recent.length === 0 ? (
          <div className="card">
            <p className="body-m" style={{ color: "var(--ink-3)" }}>
              Ainda não há propostas. Cria a primeira para começar.
            </p>
            <Link className="btn" href="/admin/proposals/new" style={{ marginTop: 12 }}>
              Nova proposta →
            </Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Token</th>
                <th>Estado</th>
                <th>Criada</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {kpis.recent.map((p) => {
                const company =
                  Array.isArray(p.prospects)
                    ? (p.prospects[0] as { company_name?: string } | undefined)?.company_name
                    : (p.prospects as { company_name?: string } | null)?.company_name;
                return (
                  <tr key={p.id}>
                    <td className="name">{company ?? "—"}</td>
                    <td className="mono" style={{ color: "var(--ink-3)" }}>
                      {p.token}
                    </td>
                    <td>
                      <span className="status-pill" data-status={p.status}>
                        {p.status}
                      </span>
                    </td>
                    <td className="mono" style={{ color: "var(--ink-3)" }}>
                      {new Date(p.created_at).toLocaleDateString("pt-PT")}
                    </td>
                    <td>
                      <Link className="link-arrow" href={`/admin/proposals/${p.id}`}>
                        Abrir <span>→</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
