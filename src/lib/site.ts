export const site = {
  name: "destaque.ai",
  legalName: "destaque.ai",
  url: "https://destaque.ai",
  adminUrl: "https://admin.destaque.ai",
  email: "contacto@destaque.ai",
  linkedin: "https://www.linkedin.com/company/destaque-ai",
  address: "Rua Luís de Freitas Branco, n.º 42 D",
  postalCode: "1600-491",
  city: "Lisboa",
  country: "Portugal",
  description:
    "Consultoria de Generative Engine Optimization (GEO). Operamos a presença da tua marca dentro de ChatGPT, Claude, Gemini, Grok, Perplexity e Copilot.",
  tagline: "O ChatGPT recomenda alguém. Tem de ser tu.",
  cta: {
    /** Link para agendar conversa (Calendly, Cal.com, etc.) */
    schedule_url: process.env.NEXT_PUBLIC_CTA_SCHEDULE_URL ?? "https://destaque.ai/agendar",
    /** Link para pagamento directo (Stripe Payment Link) */
    payment_url: process.env.NEXT_PUBLIC_CTA_PAYMENT_URL ?? "",
    /** Email directo */
    email: "contacto@destaque.ai",
  },
} as const;

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "contacto@destaque.ai";

export const adminNav = [
  { href: "/admin", label: "Dashboard", key: "dashboard", icon: "LayoutDashboard" },
  { href: "/admin/prospects", label: "Prospects", key: "prospects", icon: "Users" },
  { href: "/admin/proposals", label: "Propostas", key: "proposals", icon: "FileText" },
  { href: "/admin/settings", label: "Settings", key: "settings", icon: "Settings" },
] as const;
