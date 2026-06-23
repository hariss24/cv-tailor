import { lookup } from "node:dns/promises";
import { chromium, type Browser, type Route } from "playwright-core";

/**
 * Moteur HTML → PDF. Port de `pdf_engine.py`.
 *
 * Deux modes de lancement Chromium :
 * - **Serverless (Vercel/Lambda)** : `@sparticuz/chromium` (binaire Chromium packagé).
 * - **Local (dev)** : le Chromium installé par Playwright (`chromium.launch()` par défaut).
 *
 * Sécurité : whitelist des formats/marges (anti-injection CSS) + route-guard anti-SSRF
 * (les ressources du HTML qui résolvent vers une IP interne sont bloquées au chargement).
 */

// Formats et marges autorisés (whitelist, port de VALID_FORMATS / VALID_MARGINS).
export const VALID_FORMATS = ["A4", "A3", "A5", "Letter", "Legal", "Tabloid"] as const;
export const VALID_MARGINS = ["0", "5mm", "10mm", "15mm", "20mm", "25mm", "30mm"] as const;

export type PageFormat = (typeof VALID_FORMATS)[number];
export type Margin = (typeof VALID_MARGINS)[number];

export type PdfOptions = {
  format?: PageFormat;
  margin?: Margin;
  background?: boolean;
};

/** Détecte un environnement serverless (Vercel/Lambda) → Chromium packagé. */
function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

/** Lance Chromium selon l'environnement. */
async function launchBrowser(): Promise<Browser> {
  if (isServerless()) {
    const { default: sparticuz } = await import("@sparticuz/chromium");
    return chromium.launch({
      args: sparticuz.args,
      executablePath: await sparticuz.executablePath(),
      headless: true,
    });
  }
  return chromium.launch();
}

// ---- anti-SSRF (port de _resolves_to_blocked / _block_internal_resources) ----

/** True si l'IP (v4 ou v6) est interne/privée/réservée. Exporté pour les tests. */
export function isBlockedIp(ip: string): boolean {
  let addr = ip.toLowerCase();
  // IPv4 mappée en IPv6 (::ffff:1.2.3.4) → on teste la partie IPv4.
  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) addr = mapped[1];

  if (addr.includes(".") && !addr.includes(":")) {
    const o = addr.split(".").map(Number);
    if (o.length !== 4 || o.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
    const [a, b] = o;
    if (a === 0) return true; // 0.0.0.0/8 (this network / unspecified)
    if (a === 10) return true; // 10.0.0.0/8 privé
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 privé
    if (a === 192 && b === 168) return true; // 192.168.0.0/16 privé
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
    if (a >= 224) return true; // 224.0.0.0/4 multicast + 240.0.0.0/4 réservé
    return false;
  }

  // IPv6
  if (addr === "::1" || addr === "::") return true; // loopback / unspecified
  if (addr.startsWith("fe8") || addr.startsWith("fe9") || addr.startsWith("fea") || addr.startsWith("feb"))
    return true; // fe80::/10 link-local
  if (addr.startsWith("fc") || addr.startsWith("fd")) return true; // fc00::/7 ULA (privé)
  if (addr.startsWith("ff")) return true; // ff00::/8 multicast
  return false;
}

/** True si l'hôte résout vers une IP bloquée (ou ne résout pas → bloqué par prudence). */
async function resolvesToBlocked(hostname: string): Promise<boolean> {
  if (!hostname) return false; // data:, about:, blob: — pas de réseau
  try {
    const results = await lookup(hostname, { all: true });
    return results.some((r) => isBlockedIp(r.address));
  } catch {
    return true; // non résolvable → on bloque
  }
}

/** Handler de route : bloque les ressources internes (anti-SSRF). */
async function blockInternalResources(route: Route): Promise<void> {
  try {
    const host = new URL(route.request().url()).hostname;
    if (await resolvesToBlocked(host)) {
      await route.abort();
      return;
    }
  } catch {
    // URL non parsable (data:, etc.) → on laisse passer
  }
  await route.continue();
}

// ---- API publique ------------------------------------------------------------

/**
 * Convertit une chaîne HTML en PDF (Uint8Array).
 *
 * @throws {Error} si `format`/`margin` hors whitelist, ou si le rendu échoue.
 */
export async function htmlToPdf(html: string, options: PdfOptions = {}): Promise<Uint8Array> {
  const { format = "A4", margin = "0", background = true } = options;

  if (!VALID_FORMATS.includes(format)) {
    throw new Error(`Format non supporté : ${format}. Acceptés : ${VALID_FORMATS.join(", ")}`);
  }
  if (!VALID_MARGINS.includes(margin)) {
    throw new Error(`Marge non supportée : ${margin}. Acceptées : ${VALID_MARGINS.join(", ")}`);
  }

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.route("**/*", blockInternalResources); // anti-SSRF
    await page.setContent(html, { waitUntil: "networkidle", timeout: 30_000 });
    return await page.pdf({
      format,
      printBackground: background,
      preferCSSPageSize: true,
      margin: { top: margin, right: margin, bottom: margin, left: margin },
    });
  } finally {
    await browser.close();
  }
}
