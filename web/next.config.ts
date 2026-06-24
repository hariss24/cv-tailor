import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le dépôt parent contient son propre lockfile (app Flask) ; on fixe la racine
  // du workspace sur web/ pour que Turbopack ne remonte pas d'un cran.
  turbopack: { root: __dirname },
  // Chromium (binaire natif) ne doit pas être bundlé par le compilateur serveur.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
