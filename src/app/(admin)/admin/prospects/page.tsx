import Link from "next/link";
import { Topbar } from "@/components/admin/Topbar";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Prospects" };

type SearchParams = { q?: string; status?: string };

export default async function ProspectsPage(props: { searchParams: Promise<SearchParams> }) {
  const sp = await props.searchParams;
  const supabase = await createClient();

  const { data: all } = await supabase
    .from("prospects")
    .select("*")
    .order("created_at", { ascending: false });

  const q = sp.q?.trim().toLowerCase() ?? "";
  const statusFilter = sp.status && sp.status !== "all" ? sp.status : null;
  const prospects =
    (all ?? []).filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (q && !row.company_name.toLowerCase().includes(q)) return false;
      return true;
    });

  return (
    <>
      <Topbar
        crumbs={[{ label: "Prospects" }]}
        actions={
          <Link href="/admin/prospects/new" className="btn">
            Novo prospect →
          </Link>
        }
      />
      <div className="admin-content">
        <form
          method="get"
          style={{ display: "flex", gap: 16, marginBottom: 28, alignItems: "end" }}
        >
          <div className="field" style={{ flex: 1, maxWidth: 360 }}>
            <label htmlFor="q">Pesquisar</label>
            <input id="q" name="q" placeholder="nome da empresa" defaultValue={sp.q ?? ""} />
          </div>
          <div className="field" style={{ width: 180 }}>
            <label htmlFor="status">Estado</label>
            <select id="status" name="status" defaultValue={sp.status ?? "all"}>
              <option value="all">todos</option>
              <option value="lead">lead</option>
              <option value="contacted">contacted</option>
              <option value="opened">opened</option>
              <option value="replied">replied</option>
              <option value="scheduled">scheduled</option>
              <option value="won">won</option>
              <option value="lost">lost</option>
            </select>
          </div>
          <button type="submit" className="btn">
            Filtrar
          </button>
        </form>

        {!prospects || prospects.length === 0 ? (
          <div className="card">
            <p className="body-m" style={{ color: "var(--ink-3)", margin: 0 }}>
              Sem prospects. <Link href="/admin/prospects/new">Cria o primeiro</Link>.
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Tipo</th>
                <th>Localização</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th>Criado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => (
                <tr key={p.id}>
                  <td className="name">{p.company_name}</td>
                  <td>{p.business_type ?? "—"}</td>
                  <td>{p.location ?? "—"}</td>
                  <td>{p.contact_name ?? "—"}</td>
                  <td>
                    <span className="status-pill" data-status={p.status}>
                      {p.status}
                    </span>
                  </td>
                  <td className="mono" style={{ color: "var(--ink-3)" }}>
                    {new Date(p.created_at).toLocaleDateString("pt-PT")}
                  </td>
                  <td>
                    <Link className="link-arrow" href={`/admin/prospects/${p.id}`}>
                      Abrir <span>→</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
