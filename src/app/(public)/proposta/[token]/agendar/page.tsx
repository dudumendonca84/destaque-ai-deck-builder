import Link from "next/link";
import { Logo } from "@/components/Logo";
import { createServiceClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";

export const metadata = { title: "Agendar", robots: { index: false } };

export default async function AgendarPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const supabase = createServiceClient();
  const { data: proposal } = await supabase
    .from("proposals")
    .select("id")
    .eq("token", token)
    .is("deleted_at", null)
    .single();

  return (
    <main className="deck-pending">
      <div className="deck-pending__card">
        <Logo size={26} />
        <h1 className="tx-h2" style={{ marginTop: 16 }}>
          Vamos <em className="mark">conversar</em>
        </h1>
        <p className="body-m" style={{ color: "var(--ink-3)" }}>
          30 minutos para alinhar contexto e próximos passos. Sem compromisso.
        </p>
        <a
          className="btn-big"
          href={`mailto:${site.email}?subject=Agendar%20conversa%20GEO`}
          style={{ marginTop: 20 }}
        >
          <span>Escrever a {site.email}</span>
          <span className="arrow">→</span>
        </a>
        {proposal && (
          <Link
            href={`/proposta/${token}`}
            className="body-s"
            style={{ marginTop: 18, color: "var(--ink-3)" }}
          >
            ← Voltar à proposta
          </Link>
        )}
      </div>
    </main>
  );
}
