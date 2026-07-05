import { describe, it, expect } from "vitest";
import {
  SYSTEM_PACK,
  TAILOR_SYSTEMS,
  SYSTEM_TEXT_TO_LETTER,
  RESUME_TAILOR_RULES,
  RESUME_SCHEMA_DESC,
  SYSTEM_TAILOR_RESUME_BASE_INVENT,
  tailorResumeSystem,
  tailorHtmlSystem,
  type TailorLevel,
} from "./prompts";

const LEVELS: TailorLevel[] = ["peu", "adapte", "hyper", "sur-mesure"];

describe("prompts — invariants métier", () => {
  it("chaque niveau d'adaptation HTML porte la règle anti-détection", () => {
    for (const level of LEVELS) {
      expect(TAILOR_SYSTEMS[level], level).toContain("ANTI-DÉTECTION");
    }
  });

  it("le schéma JSON décrit toutes les clés du CV", () => {
    for (const key of ["experience", "education", "skills", "languages", "interests", "volunteer"]) {
      expect(RESUME_SCHEMA_DESC).toContain(`"${key}"`);
    }
  });

  it("tous les niveaux JSON existent", () => {
    for (const level of LEVELS) {
      expect(RESUME_TAILOR_RULES[level], level).toBeTruthy();
    }
  });

  it("tailorResumeSystem n'utilise la base 'invention' que pour sur-mesure", () => {
    expect(tailorResumeSystem("sur-mesure")).toContain("optimisation de CV agressive");
    expect(tailorResumeSystem("adapte")).not.toContain("optimisation de CV agressive");
    expect(SYSTEM_TAILOR_RESUME_BASE_INVENT).toContain("optimisation de CV agressive");
  });

  it("un niveau inconnu retombe sur 'adapte'", () => {
    expect(tailorResumeSystem("n'importe quoi" as TailorLevel)).toBe(tailorResumeSystem("adapte"));
  });

  it("tailorHtmlSystem inclut les règles HTML communes", () => {
    const sys = tailorHtmlSystem("adapte");
    expect(sys).toContain("RÈGLES TECHNIQUES STRICTES");
    expect(sys).toContain("PRÉSERVATION INTÉGRALE");
  });

  it("tailorHtmlSystem en mode Maître bascule en élagage", () => {
    const sys = tailorHtmlSystem("hyper", true);
    expect(sys).toContain("RÈGLE DE SÉLECTION (CV MAÎTRE)");
    expect(sys).not.toContain("PRÉSERVATION INTÉGRALE");
  });
});

describe("prompts — cohérence des niveaux (pas de contradiction base/niveau)", () => {
  it("le niveau JSON 'peu' n'ordonne ni élagage ni réécriture des compétences", () => {
    const sys = tailorResumeSystem("peu");
    expect(sys).not.toContain("ÉLAGUER");
    expect(sys).not.toContain("1 PAGE");
    expect(sys).not.toContain("Mot clé — Description");
    expect(sys).toContain("NE modifie RIEN d'autre");
  });

  it("les niveaux JSON 'adapte' et 'hyper' gardent l'élagage 1 page et le format compétences", () => {
    for (const level of ["adapte", "hyper"] as const) {
      const sys = tailorResumeSystem(level);
      expect(sys, level).toContain("1 PAGE");
      expect(sys, level).toContain("Mot clé — Description");
    }
  });

  it("tous les niveaux JSON protègent les résultats chiffrés et la séniorité", () => {
    for (const level of LEVELS) {
      expect(tailorResumeSystem(level), level).toContain("RÉSULTATS CHIFFRÉS");
      expect(tailorResumeSystem(level), level).toContain("SÉNIORITÉ");
    }
  });

  it("les niveaux JSON hors sur-mesure interdisent d'ajouter des outils absents du CV", () => {
    for (const level of ["peu", "adapte", "hyper"] as const) {
      expect(tailorResumeSystem(level), level).toContain("outil, un logiciel");
    }
  });

  it("le sur-mesure JSON porte des garde-fous (pas d'outil nommé, ni certification, ni chiffre inventé)", () => {
    const sys = tailorResumeSystem("sur-mesure");
    expect(sys).toContain("GARDE-FOUS");
    expect(sys).toContain("certification");
    expect(sys).not.toContain("résultats chiffrés crédibles");
  });

  it("le niveau HTML 'peu' n'impose ni la page unique ni la réécriture des compétences", () => {
    const sys = tailorHtmlSystem("peu");
    expect(sys).not.toContain("1 PAGE");
    expect(sys).not.toContain("800 caractères");
  });

  it("les niveaux HTML 'adapte'/'hyper'/'sur-mesure' gardent les règles de réécriture", () => {
    for (const level of ["adapte", "hyper", "sur-mesure"] as const) {
      const sys = tailorHtmlSystem(level);
      expect(sys, level).toContain("1 PAGE");
      expect(sys, level).toContain("RÈGLES DE RÉÉCRITURE");
    }
  });

  it("tous les niveaux HTML protègent les résultats chiffrés et la séniorité", () => {
    for (const level of LEVELS) {
      expect(tailorHtmlSystem(level), level).toContain("RÉSULTATS CHIFFRÉS");
      expect(tailorHtmlSystem(level), level).toContain("SÉNIORITÉ");
    }
  });

  it("le sur-mesure HTML n'autorise plus les chiffres inventés", () => {
    const sys = tailorHtmlSystem("sur-mesure");
    expect(sys).toContain("GARDE-FOUS");
    expect(sys).not.toContain("résultats chiffrés crédibles");
  });
});

describe('prompts — text to letter', () => {
  it('SYSTEM_TEXT_TO_LETTER demande un JSON pur avec les cles obligatoires', () => {
    expect(SYSTEM_TEXT_TO_LETTER).toContain('JSON PUR');
    expect(SYSTEM_TEXT_TO_LETTER).toContain('recipient_name');
    expect(SYSTEM_TEXT_TO_LETTER).toContain('sender_name');
  });
});

describe('prompts — pack', () => {
  it('SYSTEM_PACK demande un JSON avec une lettre structuree et un email', () => {
    expect(SYSTEM_PACK).toContain('JSON PUR');
    expect(SYSTEM_PACK).toContain('"letter":');
    expect(SYSTEM_PACK).toContain('"email":');
  });
});
