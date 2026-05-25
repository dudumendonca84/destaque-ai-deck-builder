/**
 * Compat shim — o gerador canónico vive em
 * `./prompts/generate-audit-prompts.ts` (path acordado em
 * INTERFACES.md da skill). Re-exportado aqui apenas para callers
 * legados; preferir o path canónico em código novo.
 */
export {
  generateAuditPrompts as generatePrompts,
  type PromptContext,
  type GeneratePromptsResult,
} from "./prompts/generate-audit-prompts";
