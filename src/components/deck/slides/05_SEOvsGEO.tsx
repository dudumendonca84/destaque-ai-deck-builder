"use client";

import { SlideShell } from "../primitives/SlideShell";
import { findBenchmark } from "@/lib/skill/benchmarks";
import type { SlideProps } from "../types";

export function SEOvsGEO({ deck }: SlideProps) {
  const top10 = findBenchmark(deck.benchmarks, "aio_top10_share");
  const rows = deck.method.seoVsGeo;
  return (
    <SlideShell eyebrow="SEO vs GEO">
      <h2 className="tx-h2" style={{ marginBottom: 12 }}>
        O GEO <em className="mark">assenta</em> sobre o SEO.
      </h2>
      <p className="body-m" style={{ color: "var(--ink-3)", marginBottom: 28, maxWidth: 780 }}>
        {top10 ? (
          <>
            <strong style={{ color: "var(--ink-2)" }}>{top10.value}</strong> {top10.caption}.{" "}
          </>
        ) : null}
        O SEO é o substrato; o GEO é a camada que te torna citável. Precisas dos dois.{" "}
        {top10 ? (
          <a
            href={top10.source_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--ink-4)", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Fonte: {top10.source_name}.
          </a>
        ) : null}
      </p>
      <div className="compare">
        <div className="compare__col">
          <span className="compare__head">SEO</span>
          {rows.map((r) => (
            <span className="compare__cell" key={r.seo}>
              {r.seo}
            </span>
          ))}
        </div>
        <div className="compare__col compare__col--accent">
          <span className="compare__head">GEO</span>
          {rows.map((r) => (
            <span className="compare__cell" key={r.geo}>
              {r.geo}
            </span>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}
