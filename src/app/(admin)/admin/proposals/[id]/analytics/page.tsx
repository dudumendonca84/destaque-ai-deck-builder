import { notFound } from "next/navigation";
import { Topbar } from "@/components/admin/Topbar";
import { createClient } from "@/lib/supabase/server";
import { computeAnalytics } from "@/lib/analytics/compute";
import { fmtDuration } from "@/lib/utils/format";
import { slideTitle } from "@/components/deck/slide-meta";
import type { ProposalEvent } from "@/lib/supabase/types";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id,token,prospects(company_name)")
    .eq("id", id)
    .single();

  if (!proposal) notFound();

  const company =
    (Array.isArray(proposal.prospects)
      ? (proposal.prospects[0] as { company_name?: string } | undefined)
      : (proposal.prospects as { company_name?: string } | null)
    )?.company_name ?? proposal.token;

  const { data: eventRows } = await supabase
    .from("proposal_events")
    .select("*")
    .eq("proposal_id", id)
    .order("created_at", { ascending: false });
  const events = (eventRows ?? []) as ProposalEvent[];

  const stats = computeAnalytics(events);

  return (
    <>
      <Topbar
        crumbs={[
          { label: "Propostas", href: "/admin/proposals" },
          { label: company, href: `/admin/proposals/${id}` },
          { label: "Analytics" },
        ]}
      />
      <div className="admin-content">
        <h1 className="tx-h1" style={{ marginBottom: 28 }}>
          Analytics
        </h1>

        {events.length === 0 ? (
          <div className="card">
            <p className="body-m" style={{ color: "var(--ink-3)", margin: 0 }}>
              Ainda não há atividade nesta proposta. Os dados aparecem quando o prospect
              abrir o deck.
            </p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
                marginBottom: 40,
              }}
            >
              <div className="kpi">
                <div className="kpi__label">Aberturas</div>
                <div className="kpi__value">{stats.totalOpens}</div>
                <div className="kpi__delta">total de vezes que o deck abriu</div>
              </div>
              <div className="kpi">
                <div className="kpi__label">Sessões</div>
                <div className="kpi__value">{stats.uniqueSessions}</div>
                <div className="kpi__delta">
                  {stats.uniqueSessions > 1 ? "voltou a abrir" : "visita única"}
                </div>
              </div>
              <div className="kpi">
                <div className="kpi__label">Tempo total</div>
                <div className="kpi__value" style={{ fontSize: 30 }}>
                  {fmtDuration(stats.totalSeconds)}
                </div>
                <div className="kpi__delta">somatório de todos os slides</div>
              </div>
              <div className="kpi">
                <div className="kpi__label">Média / sessão</div>
                <div className="kpi__value" style={{ fontSize: 30 }}>
                  {fmtDuration(stats.avgSessionSeconds)}
                </div>
                <div className="kpi__delta">{stats.downloads} downloads PPTX</div>
              </div>
            </div>

            {/* Tempo por slide */}
            <div className="v2-eyebrow">
              <span className="num">A1</span>
              <span className="bar" />
              <span>Tempo por slide</span>
            </div>
            <div className="card" style={{ marginBottom: 32 }}>
              <div className="slide-time">
                {stats.perSlide.map((s) => (
                  <div className="slide-time__row" key={s.n}>
                    <span className="slide-time__label">
                      {String(s.n).padStart(2, "0")} · {s.title}
                    </span>
                    <span className="slide-time__track">
                      <span
                        className="slide-time__fill"
                        style={{ width: `${(s.seconds / stats.maxSlideSeconds) * 100}%` }}
                      />
                    </span>
                    <span className="slide-time__value">
                      {s.seconds > 0 ? fmtDuration(s.seconds) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Drop-off */}
            <div className="v2-eyebrow">
              <span className="num">A2</span>
              <span className="bar" />
              <span>Drop-off — onde pararam</span>
            </div>
            <div className="card" style={{ marginBottom: 32 }}>
              {stats.dropOff.length === 0 ? (
                <p className="body-s" style={{ color: "var(--ink-3)", margin: 0 }}>
                  Sem dados de progresso.
                </p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Último slide alcançado</th>
                      <th>Sessões</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.dropOff.map((d) => (
                      <tr key={d.n}>
                        <td className="name">
                          {String(d.n).padStart(2, "0")} · {d.title}
                        </td>
                        <td>{d.sessions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Audit trail */}
            <div className="v2-eyebrow">
              <span className="num">A3</span>
              <span className="bar" />
              <span>Registo de eventos</span>
            </div>
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Quando</th>
                    <th>Evento</th>
                    <th>Slide</th>
                    <th>Duração</th>
                    <th>Sessão</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 60).map((e) => (
                    <tr key={e.id}>
                      <td className="mono" style={{ color: "var(--ink-3)" }}>
                        {new Date(e.created_at).toLocaleString("pt-PT")}
                      </td>
                      <td>{e.event_type}</td>
                      <td>
                        {e.slide_number != null
                          ? `${e.slide_number} · ${slideTitle(e.slide_number)}`
                          : "—"}
                      </td>
                      <td>
                        {e.duration_seconds != null
                          ? fmtDuration(e.duration_seconds)
                          : "—"}
                      </td>
                      <td className="mono" style={{ color: "var(--ink-3)" }}>
                        {e.session_id ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
