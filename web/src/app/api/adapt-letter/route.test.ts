import { describe, it, expect, vi } from "vitest";
import { POST } from "./route";
import { aiClient } from "@/lib/ai/client";

vi.mock("@/lib/ai/client", () => ({
  aiClient: { generateObject: vi.fn() }
}));

describe("POST /api/adapt-letter", () => {
  it("rejette les requêtes invalides", async () => {
    const req = new Request("http://localhost/api/adapt-letter", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("appelle l'IA et renvoie le corps adapté", async () => {
    vi.mocked(aiClient.generateObject).mockResolvedValueOnce({
      body: "Cher Monsieur,\n\nCandidature",
    });

    const req = new Request("http://localhost/api/adapt-letter", {
      method: "POST",
      body: JSON.stringify({ bodyLetter: "blabla", jobText: "job", resumeJson: "{}" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.body).toBe("Cher Monsieur,\n\nCandidature");
  });
});
