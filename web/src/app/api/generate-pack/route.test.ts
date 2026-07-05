import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/clients", () => ({ complete: vi.fn() }));
import { complete } from "@/lib/ai/clients";
import { POST } from "./route";

const mockComplete = vi.mocked(complete);

function req(body: unknown): Request {
  return new Request("http://localhost/api/generate-pack", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => mockComplete.mockReset());

describe("POST /api/generate-pack", () => {
  it("renvoie lettre + email et transmet entreprise/poste", async () => {
    mockComplete.mockResolvedValue(
      JSON.stringify({ letter: { body: "hello" }, email: "Objet : x" }),
    );
    const res = await POST(
      req({ cv_json: { name: "test" }, job_desc: "offre", company: "ACME", role: "Dev" }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.letter.body).toBe("hello");
    expect(data.email).toBe("Objet : x");

    const content = mockComplete.mock.calls[0][0][0].content;
    expect(content).toContain("Entreprise visée : ACME");
    expect(content).toContain("Poste visé : Dev");
  });

  it("renvoie 502 si champs manquants dans la réponse IA", async () => {
    mockComplete.mockResolvedValue(JSON.stringify({ letter: { body: "hello" } })); // pas d'email
    const res = await POST(req({ cv_json: { name: "test" }, job_desc: "offre" }));
    expect(res.status).toBe(502);
  });
});
