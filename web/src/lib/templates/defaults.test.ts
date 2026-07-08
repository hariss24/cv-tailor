import { describe, it, expect } from "vitest";
import { DEFAULT_TEMPLATES } from "./defaults";
import { buildLetterFromTemplate, renderEmail } from "./build";
import { DEFAULT_RESUME } from "@/lib/resume/schema";

describe("modèles de départ", () => {
  it("fournit 3 modèles avec des ids stables", () => {
    expect(DEFAULT_TEMPLATES.map((t) => t.id)).toEqual([
      "default-spontanee", "default-offre", "default-alternance",
    ]);
  });

  it("chaque modèle a un repli sur la formule d'appel de la lettre", () => {
    for (const t of DEFAULT_TEMPLATES) {
      expect(t.letterGreeting, t.id).toContain("{M/Mme Nom|Madame, Monsieur}");
    }
  });

  it("chaque email mentionne l'entreprise et le poste", () => {
    for (const t of DEFAULT_TEMPLATES) {
      expect(t.emailBody, t.id).toContain("{Entreprise}");
      expect(t.emailSubject + t.emailBody, t.id).toContain("{Poste}");
    }
  });
});

describe("buildLetterFromTemplate", () => {
  const tpl = DEFAULT_TEMPLATES[0];
  const cv = { ...DEFAULT_RESUME, name: "Hariss Tahet", location: "Paris, France", email: "h@x.fr", phone: "06" };
  const vars = { Entreprise: "ACME", Poste: "Chef de projet", "M/Mme Nom": "", "Prénom": "Hariss", Nom: "Tahet", Date: "8 juillet 2026" };

  it("assemble une Letter complète depuis le CV et les variables", () => {
    const letter = buildLetterFromTemplate(tpl, vars, cv, "8 juillet 2026");
    expect(letter.sender_name).toBe("Hariss Tahet");
    expect(letter.sender_contact).toBe("h@x.fr · 06");
    expect(letter.date).toBe("Paris, le 8 juillet 2026");
    expect(letter.recipient_name).toBe("ACME");
    expect(letter.greeting).toBe("Madame, Monsieur,");
    expect(letter.subject).toContain("Chef de projet");
    expect(letter.body).not.toContain("{Entreprise}");
    expect(letter.signature).toBe("Hariss Tahet");
  });

  it("replis corrects quand entreprise inconnue", () => {
    const letter = buildLetterFromTemplate(tpl, { ...vars, Entreprise: "" }, cv, "8 juillet 2026");
    expect(letter.recipient_name).toBe("À l'attention du responsable du recrutement");
  });
});

describe("renderEmail", () => {
  it("rend objet + corps avec variables substituées", () => {
    const { subject, body } = renderEmail(DEFAULT_TEMPLATES[0], {
      Entreprise: "ACME", Poste: "Dev", "M/Mme Nom": "", "Prénom": "Hariss", Nom: "Tahet", Date: "",
    });
    expect(subject).toContain("Dev");
    expect(body).toContain("ACME");
    expect(body).toContain("Bonjour,");
  });
});
