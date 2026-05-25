"use client";

import { ENGINES, ENGINE_LABEL } from "@/lib/llm/models";
import type { AuditResults } from "@/lib/supabase/types";
import { pct } from "@/lib/utils/format";

type Props = {
  audit: AuditResults | null;
};

export function TrackerEngineBreakdown({ audit }: Props) {
  return (
    <div className="tracker-engine-breakdown">
      {ENGINES.map((engine) => {
        const summary = audit?.by_engine[engine];
        const cr = summary?.citation_rate ?? 0;
        return (
          <div className="tracker-engine-card" key={engine}>
            <span className="tracker-engine-card__name">{ENGINE_LABEL[engine]}</span>
            <span className="tracker-engine-card__cr">{pct(cr)}</span>
            <span className="tracker-engine-card__label">taxa de citação</span>
            <span className="tracker-engine-card__sov">
              SoV {summary ? pct(summary.share_of_voice) : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
