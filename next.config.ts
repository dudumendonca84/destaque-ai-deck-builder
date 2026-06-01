import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sparticuz/chromium traz o binário do Chrome (brotli em bin/). Tem de
  // ser tratado como external — senão o bundler tenta empacotá-lo e o
  // binário não fica disponível em runtime na Vercel (page.pdf rebenta).
  // puppeteer-core idem. Ambos carregados só na route download-pdf (Node).
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
};

export default nextConfig;
