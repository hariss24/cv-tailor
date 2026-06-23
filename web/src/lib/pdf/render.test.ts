import { describe, it, expect } from "vitest";
import { htmlToPdf, isBlockedIp, VALID_FORMATS, VALID_MARGINS } from "./render";

describe("isBlockedIp (anti-SSRF)", () => {
  it("bloque les IPv4 internes / privées / réservées", () => {
    for (const ip of [
      "127.0.0.1", // loopback
      "10.0.0.5", // privé
      "172.16.0.1", // privé
      "172.31.255.255", // privé (haut de la plage)
      "192.168.1.1", // privé
      "169.254.169.254", // métadonnées cloud (link-local)
      "100.64.0.1", // CGNAT
      "0.0.0.0", // unspecified
      "224.0.0.1", // multicast
      "240.0.0.1", // réservé
    ]) {
      expect(isBlockedIp(ip), ip).toBe(true);
    }
  });

  it("autorise les IPv4 publiques", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "172.15.0.1", "100.63.0.1"]) {
      expect(isBlockedIp(ip), ip).toBe(false);
    }
  });

  it("bloque les IPv6 internes et l'IPv4 mappée privée", () => {
    expect(isBlockedIp("::1")).toBe(true); // loopback
    expect(isBlockedIp("fe80::1")).toBe(true); // link-local
    expect(isBlockedIp("fc00::1")).toBe(true); // ULA
    expect(isBlockedIp("ff02::1")).toBe(true); // multicast
    expect(isBlockedIp("::ffff:127.0.0.1")).toBe(true); // IPv4 mappée loopback
  });

  it("autorise les IPv6 publiques", () => {
    expect(isBlockedIp("2606:4700:4700::1111")).toBe(false); // Cloudflare
    expect(isBlockedIp("::ffff:8.8.8.8")).toBe(false); // IPv4 mappée publique
  });
});

describe("htmlToPdf (whitelist)", () => {
  it("rejette un format hors whitelist avant tout rendu", async () => {
    // @ts-expect-error test d'une valeur invalide
    await expect(htmlToPdf("<h1>x</h1>", { format: "B4" })).rejects.toThrow(/Format non support/);
  });

  it("rejette une marge hors whitelist avant tout rendu", async () => {
    // @ts-expect-error test d'une valeur invalide
    await expect(htmlToPdf("<h1>x</h1>", { margin: "42mm" })).rejects.toThrow(/Marge non support/);
  });

  it("expose les whitelists attendues", () => {
    expect(VALID_FORMATS).toContain("A4");
    expect(VALID_MARGINS).toContain("0");
  });
});
