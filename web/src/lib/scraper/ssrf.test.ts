import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateUrlForScraping } from "./ssrf";
import dns from "dns/promises";

vi.mock("dns/promises");

describe("SSRF Protection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should allow a valid public URL", async () => {
    vi.mocked(dns.lookup).mockResolvedValue([{ address: "93.184.216.34", family: 4 }] as any);
    const url = await validateUrlForScraping("https://example.com/job/123");
    expect(url).toBe("https://example.com/job/123");
  });

  it("should strip credentials from URL", async () => {
    vi.mocked(dns.lookup).mockResolvedValue([{ address: "93.184.216.34", family: 4 }] as any);
    const url = await validateUrlForScraping("https://user:pass@example.com/job/123");
    expect(url).toBe("https://example.com/job/123");
  });

  it("should reject localhost (127.0.0.1)", async () => {
    vi.mocked(dns.lookup).mockResolvedValue([{ address: "127.0.0.1", family: 4 }] as any);
    await expect(validateUrlForScraping("http://localhost/admin")).rejects.toThrow("URL non autorisée.");
  });

  it("should reject private IP (192.168.1.5)", async () => {
    vi.mocked(dns.lookup).mockResolvedValue([{ address: "192.168.1.5", family: 4 }] as any);
    await expect(validateUrlForScraping("http://internal-site.local")).rejects.toThrow("URL non autorisée.");
  });

  it("should reject IPv6 localhost (::1)", async () => {
    vi.mocked(dns.lookup).mockResolvedValue([{ address: "::1", family: 6 }] as any);
    await expect(validateUrlForScraping("http://[::1]/")).rejects.toThrow("URL non autorisée.");
  });

  it("should reject IPv4-mapped IPv6 localhost", async () => {
    vi.mocked(dns.lookup).mockResolvedValue([{ address: "::ffff:127.0.0.1", family: 6 }] as any);
    await expect(validateUrlForScraping("http://test/")).rejects.toThrow("URL non autorisée.");
  });

  it("should reject invalid scheme (ftp)", async () => {
    await expect(validateUrlForScraping("ftp://example.com")).rejects.toThrow("seuls http et https sont autorisés");
  });

  it("should reject unresolvable host", async () => {
    vi.mocked(dns.lookup).mockRejectedValue(new Error("ENOTFOUND"));
    await expect(validateUrlForScraping("https://this-does-not-exist.foo")).rejects.toThrow("Impossible de résoudre l'hôte");
  });
});
