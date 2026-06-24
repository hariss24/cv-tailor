import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scrapeJobText } from "./scraper";
import * as ssrf from "./ssrf";

// Mock global fetch
const originalFetch = global.fetch;

describe("scraper", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(ssrf, "validateUrlForScraping").mockImplementation(async (url) => url);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should extract text from direct fetch if valid HTML", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      text: async () => `
        <html><head><title>Test Job</title></head>
        <body>
          <div class="job-description">
            We are looking for a software engineer to join our amazing team.
            Requirements: 10 years of experience with HTML.
            ${"pad".repeat(100) /* make it longer than 200 chars */}
          </div>
        </body></html>
      `
    } as any);

    const res = await scrapeJobText("https://example.com/job");
    expect(res.title).toBe("Test Job");
    expect(res.text).toContain("We are looking for a software engineer");
    expect(global.fetch).toHaveBeenCalledTimes(1); // No fallback to Jina
  });

  it("should fallback to Jina if direct fetch returns 403", async () => {
    // 1st call (direct) -> 403
    // 2nd call (jina) -> success
    vi.mocked(global.fetch).mockImplementation(async (url) => {
      if (url.toString().startsWith("https://r.jina.ai/")) {
        return {
          ok: true,
          text: async () => "# Job Title\n\nWe are looking for a ninja."
        } as any;
      }
      return {
        ok: false,
        status: 403
      } as any;
    });

    const res = await scrapeJobText("https://example.com/blocked");
    expect(res.text).toBe("# Job Title\n\nWe are looking for a ninja.");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("should fallback to Jina if extracted text is too short", async () => {
    // 1st call (direct) -> 200 OK but tiny text
    // 2nd call (jina) -> success
    vi.mocked(global.fetch).mockImplementation(async (url) => {
      if (url.toString().startsWith("https://r.jina.ai/")) {
        return {
          ok: true,
          text: async () => "Jina extracted text"
        } as any;
      }
      return {
        ok: true,
        text: async () => `<html><body><div class="job-description">Tiny text</div></body></html>`
      } as any;
    });

    const res = await scrapeJobText("https://example.com/short");
    expect(res.text).toBe("Jina extracted text");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("should throw if Jina is also blocked", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 403
    } as any);

    await expect(scrapeJobText("https://example.com/ultra-blocked")).rejects.toThrow("accès bloqué par le site");
  });
});
