import { Topbar } from "@/components/admin/Topbar";
import { ProspectForm } from "@/components/admin/ProspectForm";
import { createProspect } from "../actions";

export const metadata = { title: "Novo prospect" };

export default function NewProspectPage() {
  return (
    <>
      <Topbar
        crumbs={[
          { label: "Prospects", href: "/admin/prospects" },
          { label: "Novo" },
        ]}
      />
      <div className="admin-content">
        <div className="wizard">
          <h1 className="tx-h1" style={{ marginBottom: 32 }}>
            Novo <em className="mark">prospect</em>
          </h1>
          <ProspectForm action={createProspect} submitLabel="Criar prospect" />
        </div>
      </div>
    </>
  );
}
