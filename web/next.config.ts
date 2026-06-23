import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le dépôt parent contient son propre lockfile (app Flask) ; on fixe la racine
  // du workspace sur web/ pour que Turbopack ne remonte pas d'un cran.
  turbopack: { root: __dirname },
  // Chromium (binaire natif) ne doit pas être bundlé par le compilateur serveur.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
};

export default nextConfig;
