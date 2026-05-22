import Link from "next/link";
import { Topbar } from "@/components/admin/Topbar";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Propostas" };

export default async function ProposalsPage() {
  const supabase = await createClient();
  const { data: proposals } = await supabase
    .from("proposals")
    .select(
      "id,token,created_at,status,audit_status,prospect_id,prospects(company_name,business_type)",
    )
    .order("created_at", { ascending: false });

  return (
    <>
      <Topbar
        crumbs={[{ label: "Propostas" }]}
        actions={
          <Link href="/admin/proposals/new" className="btn">
            Nova proposta →
          </Link>
        }
      />
      <div className="admin-content">
        {!proposals || proposals.length === 0 ? (
          <div className="card">
            <p className="body-m" style={{ color: "var(--ink-3)", margin: 0 }}>
              Sem propostas. <Link href="/admin/proposals/new">Cria a primeira</Link>.
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Token</th>
                <th>Auditoria</th>
                <th>Estado</th>
                <th>Criada</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p) => {
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
                      <span className="status-pill" data-status={p.audit_status}>
                        {p.audit_status}
                      </span>
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
