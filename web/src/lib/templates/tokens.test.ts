import { describe, it, expect } from "vitest";
import { parseTokens } from "./tokens";

describe("parseTokens", () => {
  it("texte nu → un seul segment texte", () => {
    expect(parseTokens("Bonjour")).toEqual([{ type: "text", text: "Bonjour" }]);
  });

  it("chaîne vide → aucun segment", () => {
    expect(parseTokens("")).toEqual([]);
  });

  it("token simple entouré de texte", () => {
    expect(parseTokens("a {Poste} b")).toEqual([
      { type: "text", text: "a " },
      { type: "var", name: "Poste", raw: "{Poste}" },
      { type: "text", text: " b" },
    ]);
  });

  it("préserve le token brut avec repli", () => {
    expect(parseTokens("{M/Mme Nom|Madame, Monsieur},")).toEqual([
      { type: "var", name: "M/Mme Nom", raw: "{M/Mme Nom|Madame, Monsieur}" },
      { type: "text", text: "," },
    ]);
  });

  it("tokens consécutifs", () => {
    expect(parseTokens("{Prénom} {Nom}")).toEqual([
      { type: "var", name: "Prénom", raw: "{Prénom}" },
      { type: "text", text: " " },
      { type: "var", name: "Nom", raw: "{Nom}" },
    ]);
  });
});
