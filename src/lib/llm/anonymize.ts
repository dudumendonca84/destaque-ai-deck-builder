/**
 * Anonimiza uma lista de competitors mantendo ordem — A, B, C, ...
 * Usado em decks públicos para criar gancho comercial: o cliente fica
 * curioso sobre "quem é o A" e a resposta vem em call comercial.
 *
 * Mantém referência ao nome real via map para uso interno (admin UI).
 */

export type AnonymizedCompetitor = {
  label: string; // "A", "B", "C", ...
  realName: string;
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function anonymizeCompetitors(names: string[]): AnonymizedCompetitor[] {
  return names
    .filter((n) => n?.trim())
    .slice(0, LETTERS.length)
    .map((realName, i) => ({ label: LETTERS[i], realName: realName.trim() }));
}

export function anonymizedLabels(names: string[]): string[] {
  return anonymizeCompetitors(names).map((c) => c.label);
}
