import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/admin/Topbar";
import { ProspectForm } from "@/components/admin/ProspectForm";
import { createClient } from "@/lib/supabase/server";
import { updateProspect } from "../actions";

export const metadata = { title: "Prospect" };

export default async function ProspectPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: prospect } = await supabase.from("prospects").select("*").eq("id", id).single();

  if (!prospect) notFound();

  const update = updateProspect.bind(null, id);

  return (
    <>
      <Topbar
        crumbs={[
          { label: "Prospects", href: "/admin/prospects" },
          { label: prospect.company_name },
        ]}
        actions={
          <Link href={`/admin/proposals/new?prospect_id=${id}`} className="btn">
            Nova proposta →
          </Link>
        }
      />
      <div className="admin-content">
        <div className="wizard">
          <h1 className="tx-h1" style={{ marginBottom: 8 }}>
            {prospect.company_name}
          </h1>
          <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 32 }}>
            {prospect.business_type ?? "—"} · {prospect.location ?? "—"} · estado{" "}
            <b>{prospect.status}</b>
          </p>
          <ProspectForm action={update} prospect={prospect} submitLabel="Guardar alterações" />
        </div>
      </div>
    </>
  );
}
