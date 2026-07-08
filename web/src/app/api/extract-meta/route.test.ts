import { describe, it, expect, vi } from "vitest";
import { POST } from "./route";
import { aiClient } from "@/lib/ai/client";

vi.mock("@/lib/ai/client", () => ({
  aiClient: { generateObject: vi.fn() }
}));

describe("POST /api/extract-meta", () => {
  it("rejette les requêtes invalides", async () => {
    const req = new Request("http://localhost/api/extract-meta", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("appelle l'IA et renvoie l'entreprise et le poste", async () => {
    vi.mocked(aiClient.generateObject).mockResolvedValueOnce({
      company: "Google",
      role: "Software Engineer",
    });

    const req = new Request("http://localhost/api/extract-meta", {
      method: "POST",
      body: JSON.stringify({ jobText: "Offre..." }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.company).toBe("Google");
    expect(data.role).toBe("Software Engineer");
  });
});
