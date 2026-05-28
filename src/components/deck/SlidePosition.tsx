"use client";

import { createContext, useContext } from "react";

/**
 * Posição real do slide no deck (1-based) + total. Fornecida pelo
 * DeckContainer e lida pelo SlideShell para o eyebrow — evita números
 * hardcoded ("18/26") que ficam errados quando o deck é dinâmico.
 */
export const SlidePositionContext = createContext<{ index: number; total: number } | null>(null);

export function useSlidePosition() {
  return useContext(SlidePositionContext);
}
