import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sparticuz/chromium traz o binário do Chrome (brotli em bin/). Tem de
  // ser tratado como external — senão o bundler tenta empacotá-lo e o
  // binário não fica disponível em runtime na Vercel (page.pdf rebenta).
  // puppeteer-core idem. Ambos carregados só na route download-pdf (Node).
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // Turbopack (Next 16 default) não inclui automaticamente o bin/ do
  // @sparticuz/chromium no output da função — só o JS do package. Sem o
  // bin/, chromium.executablePath() falha com "input directory does not
  // exist" e o catch do route cai no fallback @react-pdf. Forçar a
  // inclusão do bin/ no file trace da rota /download-pdf.
  outputFileTracingIncludes: {
    "/api/proposals/[token]/download-pdf": [
      "./node_modules/@sparticuz/chromium/bin/**",
    ],
  },
};

export default nextConfig;
