/**
 * 8 dimensões SINAL canónicas (taxonomia v1.7), espelham
 * `## Deck Builder method` em SKILL.md §116-130 da skill geo-seo-aeo-master.
 *
 * Único sítio em código TypeScript onde as 8 dimensões estão hardcoded —
 * synthesize-deck.ts (enum do schema), slides (labels) e qualquer outro
 * consumer leem daqui. Quando a skill rebalancear a taxonomia
 * (methodology-changelog.md trigger), actualiza-se este ficheiro.
 *
 * Princípio "skill é o cérebro": os labels PT-PT em DIMENSION_LABEL são
 * o fallback offline; em runtime, o nome cliente-facing vem de
 * `deck.method.dimensions` (loadMethod) que faz fetch vivo. A taxonomia
 * (keys + ordem) está hardcoded porque é contrato de schema com Claude.
 */
export const DIMENSION_KEYS = [
  "technical",
  "content",
  "entity",
  "authority",
  "social",
  "authority_on_site",
  "measurement",
  "positioning",
] as const;

export type Dimension = (typeof DIMENSION_KEYS)[number];

export const DIMENSION_LABEL: Record<Dimension, string> = {
  technical: "Técnica",
  content: "Conteúdo",
  entity: "Entidade",
  authority: "Autoridade",
  social: "Social & comunidade",
  authority_on_site: "Autoridade no site",
  measurement: "Medição",
  positioning: "Posicionamento",
};
