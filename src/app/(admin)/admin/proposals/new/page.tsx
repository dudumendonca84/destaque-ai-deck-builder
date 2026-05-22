import Link from "next/link";
import { Topbar } from "@/components/admin/Topbar";
import { ProposalWizard } from "@/components/admin/ProposalWizard";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Nova proposta" };

export default async function NewProposalPage(props: {
  searchParams: Promise<{ prospect_id?: string }>;
}) {
  const sp = await props.searchParams;
  const supabase = await createClient();
  const { data: prospects } = await supabase
    .from("prospects")
    .select("id,company_name,business_type,location,target_audience,competitors")
    .order("company_name");

  if (!prospects || prospects.length === 0) {
    return (
      <>
        <Topbar
          crumbs={[
            { label: "Propostas", href: "/admin/proposals" },
            { label: "Nova" },
          ]}
        />
        <div className="admin-content">
          <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
            <h2 className="tx-h2" style={{ marginBottom: 12 }}>
              Sem prospects
            </h2>
            <p className="body-m" style={{ color: "var(--ink-3)" }}>
              Para criar uma proposta precisas de um prospect.
            </p>
            <Link className="btn-big" href="/admin/prospects/new">
              <span>Criar prospect</span>
              <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        crumbs={[
          { label: "Propostas", href: "/admin/proposals" },
          { label: "Nova" },
        ]}
      />
      <div className="admin-content">
        <h1 className="tx-h1" style={{ marginBottom: 32 }}>
          Nova <em className="mark">proposta</em>
        </h1>
        <ProposalWizard prospects={prospects} initialProspectId={sp.prospect_id} />
      </div>
    </>
  );
}
