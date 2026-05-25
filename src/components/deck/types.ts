import type { AuditResults, AuditRun, AuditTier, Engine } from "@/lib/supabase/types";
import type { Benchmark } from "@/lib/skill/benchmarks";
import type { ScanResult } from "@/lib/scan/types";

export type DeckData = {
  token: string;
  companyName: string;
  businessType: string | null;
  location: string | null;
  customMessage: string | null;
  auditTier: AuditTier;
  pricing: {
    diagnostico: number | null;
    sprint: number | null;
    retainer: number | null;
  };
  prompts: string[];
  competitors: string[];
  audit: AuditResults | null;
  auditRuns: AuditRun[];
  benchmarks: Benchmark[];
  sinalScan: ScanResult | null;
};

export type SlideProps = {
  deck: DeckData;
  active: boolean;
};

export type SlideDef = {
  id: string;
  title: string;
  /** Slides com fundo preto intencional. */
  tone: "paper" | "ink";
  Component: React.ComponentType<SlideProps>;
};

export function runsForEngine(deck: DeckData, engine: Engine): AuditRun[] {
  return deck.auditRuns.filter((r) => r.engine === engine);
}
