/** Fonte (URL) citada por um motor via web search. */
export type EngineSource = {
  url: string;
  title?: string;
  /** Domínio cru (best-effort), ex. "reddit.com". */
  domain?: string;
};

export type EngineQueryResult = {
  response: string;
  tokens: number;
  /** Fontes citadas via web search (só em runs grounded). */
  sources?: EngineSource[];
};

/** Análise extraída de uma resposta de motor (via Claude). */
export type CitationAnalysis = {
  citations_found: string[];
  brand_present: boolean;
  brand_position: number | null;
  competitors_mentioned: string[];
  sentiment_score: number;
};
