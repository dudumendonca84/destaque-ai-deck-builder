"use client";

import { motion } from "framer-motion";
import { SlideShell } from "../primitives/SlideShell";
import type { SlideProps } from "../types";
import type { Finding } from "@/lib/scan/types";

const DIMENSION_LABEL: Record<string, string> = {
  technical: "Técnica",
  content: "Conteúdo",
  entity: "Entidade",
  authority: "Autoridade",
  ux: "UX",
  measurement: "Medição",
  positioning: "Posicionamento",
  operational: "Operacional",
};

function severityColor(s: Finding["severity"]): { bg: string; fg: string } {
  if (s === "critical") return { bg: "#fee2e2", fg: "#991b1b" };
  if (s === "warning") return { bg: "#fef3c7", fg: "#92400e" };
  if (s === "ok") return { bg: "#dcfce7", fg: "#166534" };
  if (s === "info") return { bg: "#dbeafe", fg: "#1e40af" };
  return { bg: "#f3f4f6", fg: "#374151" };
}

function severityLabel(s: Finding["severity"]): string {
  if (s === "critical") return "CRÍTICO";
  if (s === "warning") return "ATENÇÃO";
  if (s === "ok") return "OK";
  if (s === "info") return "INFO";
  return "—";
}

export function AppendixE({ deck, active }: SlideProps) {
  const scan = deck.sinalScan;

  if (!scan) {
    return (
      <SlideShell index={18} total={22} eyebrow="Apêndice E · Análise SINAL">
        <h2 className="tx-h2" style={{ marginBottom: 12 }}>
          Análise SINAL — <em className="mark">o teu site</em>
        </h2>
        <p className="body-m" style={{ color: "var(--ink-3)" }}>
          Sem dados de scan para este audit. A análise técnica + entidade + autoridade
          corre quando há domínio do prospect configurado.
        </p>
      </SlideShell>
    );
  }

  // Top findings — critical primeiro, depois warning.
  const findings = scan.dimensions
    .flatMap((d) => d.findings)
    .filter((f) => f.severity === "critical" || f.severity === "warning")
    .slice(0, 6);

  return (
    <SlideShell index={18} total={22} eyebrow="Apêndice E · Análise SINAL">
      <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginBottom: 24 }}>
        <h2 className="tx-h2" style={{ margin: 0 }}>
          Análise SINAL — <em className="mark">o teu site</em>
        </h2>
        <span
          className="mono"
          style={{
            fontSize: 38,
            lineHeight: 1,
            color: scan.score >= 70 ? "#166534" : scan.score >= 50 ? "#92400e" : "#991b1b",
          }}
        >
          {scan.score}<span style={{ fontSize: 20 }}>/100</span>
        </span>
      </div>

      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 16 }}>
        Score global ponderado das 8 dimensões SINAL. {scan.critical_findings.length} findings
        críticos, {scan.unknown_count} verificações por confirmar manualmente.
      </p>

      <div className="appendix-e-grid">
        {scan.dimensions
          .filter((d) => d.findings.length > 0)
          .map((d) => (
            <motion.div
              key={d.dimension}
              className="appendix-e-dim"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: active ? 1 : 0, y: active ? 0 : 10 }}
              transition={{ duration: 0.4 }}
            >
              <div className="appendix-e-dim__head">
                <span className="appendix-e-dim__name">{DIMENSION_LABEL[d.dimension]}</span>
                <span className="appendix-e-dim__score">{d.score}</span>
              </div>
              <span className="appendix-e-dim__count">
                {d.findings.length} {d.findings.length === 1 ? "finding" : "findings"}
              </span>
            </motion.div>
          ))}
      </div>

      <div className="appendix-e-findings">
        <h3 className="tx-h3" style={{ marginBottom: 12 }}>Findings prioritários</h3>
        {findings.length === 0 ? (
          <p className="body-s" style={{ color: "var(--ink-3)" }}>
            Sem findings críticos ou de aviso. Ver `/admin/proposals/.../scan` para os
            findings informativos.
          </p>
        ) : (
          <ul className="appendix-e-list">
            {findings.map((f) => {
              const c = severityColor(f.severity);
              return (
                <li key={f.id}>
                  <div className="appendix-e-finding__head">
                    <span
                      className="appendix-e-finding__sev"
                      style={{ background: c.bg, color: c.fg }}
                    >
                      {severityLabel(f.severity)}
                    </span>
                    <span className="appendix-e-finding__title">{f.title}</span>
                  </div>
                  {f.why_it_matters && (
                    <p className="body-s appendix-e-finding__why">{f.why_it_matters}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SlideShell>
  );
}
