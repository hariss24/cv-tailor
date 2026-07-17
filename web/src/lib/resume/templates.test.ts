import { describe, it, expect } from "vitest";
import { TEMPLATE_IDS } from "./templates";

describe("TEMPLATES", () => {
  it("expose les 4 modèles attendus", () => {
    expect([...TEMPLATE_IDS].sort()).toEqual(
      ["graphique", "kakuna", "marine", "sobre"],
    );
  });
});
