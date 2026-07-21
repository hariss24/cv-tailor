import { describe, it, expect, vi, beforeEach } from "vitest";
import { scoreOffer, criteriaPromptLines } from "./score";
import { parseProfile } from "./profileSchema";
import hariss from "../../../tests/fixtures/job_profile_hariss.json";
const DEFAULT_PROFILE = parseProfile(hariss);

// Mock du client Gemini : on contrôle le JSON renvoyé par completeJson.
const completeJson = vi.fn();
vi.mock("@/lib/ai/clients", () => ({ completeJson: (...a: unknown[]) => completeJson(...a) }));

beforeEach(() => completeJson.mockReset());

describe("scoreOffer", () => {
  it("parse le JSON et renvoie le breakdown", async () => {
    completeJson.mockResolvedValue(
      JSON.stringify({
        score_tech: 35, score_seniority: 18, score_sector: 12, score_geo: 10,
        score_red_flags: 9, total_score: 84, red_flags_reasons: ["Salaire non précisé"],
      }),
    );
    const out = await scoreOffer({ title: "Webmaster", company: "ACME", jobText: "..." }, { transit: "25 min" }, DEFAULT_PROFILE, "KEY");
    expect(out.total_score).toBe(84);
    expect(out.score_tech).toBe(35);
    expect(out.red_flags_reasons).toEqual(["Salaire non précisé"]);
  });

  it("borne total_score entre 0 et 100 et arrondit", async () => {
    completeJson.mockResolvedValue(JSON.stringify({ total_score: 150.7 }));
    const out = await scoreOffer({ title: "x", company: "", jobText: "" }, {}, DEFAULT_PROFILE, "KEY");
    expect(out.total_score).toBe(100);
  });

  it("injecte le profil candidat dans le système et le trajet dans le prompt", async () => {
    completeJson.mockResolvedValue(JSON.stringify({ total_score: 50 }));
    await scoreOffer({ title: "Dev", company: "ACME", jobText: "..." }, { transit: "30 min" }, DEFAULT_PROFILE, "KEY");
    const [prompt, system] = completeJson.mock.calls[0] as unknown as [string, string];
    expect(system).toContain("Hariss Hafeji");
    expect(prompt).toContain("Transports en commun: 30 min");
    expect(prompt).toContain("Titre: Dev");
  });

  it("red_flags_reasons vide si absent/invalide", async () => {
    completeJson.mockResolvedValue(JSON.stringify({ total_score: 70 }));
    const out = await scoreOffer({ title: "x", company: "", jobText: "" }, {}, DEFAULT_PROFILE, "KEY");
    expect(out.red_flags_reasons).toEqual([]);
  });
});

describe("criteriaPromptLines", () => {
  it("reproduit le barème attendu depuis la grille structurée", () => {
    expect(criteriaPromptLines(DEFAULT_PROFILE.scoringCriteria)).toBe(
      "score_tech (0-40) : Match avec sa stack (CMS, intégration, SEO, analytics).\n" +
        "score_seniority (0-20) : Adapté à un profil Junior (Bac+5 avec 1-2 ans d'expérience en stage).\n" +
        "score_sector (0-15) : Pertinence dans le secteur web/e-commerce.\n" +
        "score_geo (0-15) : Ajuste avec les temps de trajet fournis (pénalise si > 45 min depuis Paris 12e).\n" +
        "score_red_flags (0-10) : 10 = aucun piège (salaire flou, travail dissimulé, ou alternance masquée).",
    );
  });
});
