/**
 * SINAL scan — tipos e contratos.
 *
 * O scan cobre 8 dimensões SINAL (ver CLAUDE.md). Cada sub-check produz
 * `Finding[]` com severity, evidence e suggestion. Findings agregam para
 * score por dimensão + score global.
 */

export type Severity = "critical" | "warning" | "ok" | "info" | "unknown";

export type Dimension =
  | "technical"
  | "content"
  | "entity"
  | "authority"
  | "ux"
  | "measurement"
  | "positioning"
  | "operational";

export type Finding = {
  /** ID estável da check — ex.: "schema.organization.missing" */
  id: string;
  dimension: Dimension;
  severity: Severity;
  title: string;
  /** Porque é que isto importa, em PT-PT, tom SINAL (sober). */
  why_it_matters: string;
  /** Acção concreta a tomar. */
  suggestion: string;
  /** Evidence — JSON-LD parsed, headers brutos, URL com problema, etc. */
  evidence?: Record<string, unknown>;
};

export type DimensionResult = {
  dimension: Dimension;
  /** 0-100, derivado dos findings (critical -25, warning -10, ok +5). */
  score: number;
  findings: Finding[];
};

export type ScanResult = {
  domain: string;
  scanned_at: string;
  /** Score global ponderado (0-100). */
  score: number;
  dimensions: DimensionResult[];
  /** Findings com severity critical, ordenados por impacto. Top-line do deck. */
  critical_findings: Finding[];
  /** Quantos checks falharam por timeout/erro (informativo). */
  unknown_count: number;
};

/** Sub-check function signature — recebe domain, devolve findings. */
export type SubCheck = (input: SubCheckInput) => Promise<Finding[]>;

export type SubCheckInput = {
  domain: string;
  url: string; // url completa, ex: https://destaque.ai
  fetchOptions: { signal?: AbortSignal; userAgent: string };
};
