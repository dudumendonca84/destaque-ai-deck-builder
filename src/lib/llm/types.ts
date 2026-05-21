export type EngineQueryResult = {
  response: string;
  tokens: number;
};

/** Análise extraída de uma resposta de motor (via Claude). */
export type CitationAnalysis = {
  citations_found: string[];
  brand_present: boolean;
  brand_position: number | null;
  competitors_mentioned: string[];
  sentiment_score: number;
};
