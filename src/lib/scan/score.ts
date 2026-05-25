import type { Dimension, DimensionResult, Finding, ScanResult, Severity } from "./types";

const SEVERITY_DELTA: Record<Severity, number> = {
  critical: -25,
  warning: -10,
  info: 0,
  ok: 5,
  unknown: 0,
};

const DIMENSION_WEIGHT: Record<Dimension, number> = {
  technical: 0.18,
  content: 0.13,
  entity: 0.18,
  authority: 0.16,
  ux: 0.08,
  measurement: 0.08,
  positioning: 0.10,
  operational: 0.09,
};

const ALL_DIMENSIONS: Dimension[] = [
  "technical",
  "content",
  "entity",
  "authority",
  "ux",
  "measurement",
  "positioning",
  "operational",
];

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function scoreFor(findings: Finding[]): number {
  // baseline 70: cada finding move o score conforme severity.
  // critical (-25), warning (-10), ok (+5), info/unknown (0).
  const sum = findings.reduce((acc, f) => acc + SEVERITY_DELTA[f.severity], 0);
  return clamp(70 + sum);
}

export function aggregate(
  domain: string,
  findings: Finding[],
): ScanResult {
  const byDim = new Map<Dimension, Finding[]>();
  let unknownCount = 0;
  for (const f of findings) {
    if (f.severity === "unknown") unknownCount += 1;
    const arr = byDim.get(f.dimension) ?? [];
    arr.push(f);
    byDim.set(f.dimension, arr);
  }

  const dimensions: DimensionResult[] = ALL_DIMENSIONS.map((dimension) => {
    const dimFindings = byDim.get(dimension) ?? [];
    return { dimension, score: scoreFor(dimFindings), findings: dimFindings };
  });

  const score = clamp(
    Math.round(
      dimensions.reduce((acc, d) => acc + d.score * DIMENSION_WEIGHT[d.dimension], 0),
    ),
  );

  const critical_findings = findings
    .filter((f) => f.severity === "critical")
    .slice(0, 10);

  return {
    domain,
    scanned_at: new Date().toISOString(),
    score,
    dimensions,
    critical_findings,
    unknown_count: unknownCount,
  };
}
