import { describe, it, expect } from "vitest";
import { DEFAULT_RESUME, type Resume } from "./schema";
import {
  unwrap,
  normalizeResume,
  normalizeLetter,
  isEmptyResume,
  preservePhoto,
  mergeTailored,
} from "./normalize";

describe("unwrap", () => {
  it("retourne l'objet déjà au bon format", () => {
    expect(unwrap({ name: "Alice" })).toEqual({ name: "Alice" });
  });
  it("dés-emballe une liste [{...}]", () => {
    expect(unwrap([{ name: "Bob" }])).toEqual({ name: "Bob" });
  });
  it("dés-emballe une enveloppe {cv: {...}}", () => {
    expect(unwrap({ cv: { name: "Carol", skills: [] } })).toEqual({ name: "Carol", skills: [] });
  });
});

describe("normalizeResume", () => {
  it("coerce les types et comble les champs manquants", () => {
    const r = normalizeResume({ name: "Alice" });
    expect(r.name).toBe("Alice");
    expect(r.experience).toEqual([]);
    expect(r.skills).toEqual([]);
  });

  it("découpe une chaîne de compétences en tableau", () => {
    const r = normalizeResume({ skills: "JS, TS; Python\nGo" });
    expect(r.skills).toEqual(["JS", "TS", "Python", "Go"]);
  });

  it("clampe les bullets d'expérience à 8", () => {
    const bullets = Array.from({ length: 12 }, (_, i) => `point ${i}`);
    const r = normalizeResume({ experience: [{ title: "X", bullets }] });
    expect(r.experience[0].bullets).toHaveLength(8);
  });

  it("ignore les langues sans nom", () => {
    const r = normalizeResume({ languages: [{ name: "", level: "Natif" }, { name: "FR" }] });
    expect(r.languages).toEqual([{ name: "FR", level: "" }]);
  });
});

describe("normalizeLetter", () => {
  it("comble les champs vides avec DEFAULT_LETTER", () => {
    const l = normalizeLetter({ subject: "Mon sujet" });
    expect(l.subject).toBe("Mon sujet");
    expect(l.greeting).toBe("Madame, Monsieur,");
  });
});

describe("isEmptyResume", () => {
  it("vrai pour un CV sans cœur", () => {
    expect(isEmptyResume(normalizeResume({}))).toBe(true);
  });
  it("faux dès qu'il y a un nom", () => {
    expect(isEmptyResume(normalizeResume({ name: "Alice" }))).toBe(false);
  });
});

describe("preservePhoto", () => {
  it("restaure la photo de base si l'entrant n'en a pas", () => {
    const base = { ...DEFAULT_RESUME, photo: "data:image/png;base64,AAA" };
    const incoming = normalizeResume({ name: "Alice" });
    expect(preservePhoto(incoming, base).photo).toBe("data:image/png;base64,AAA");
  });
  it("garde la photo entrante si présente", () => {
    const base = { ...DEFAULT_RESUME, photo: "OLD" };
    const incoming = { ...normalizeResume({ name: "Alice" }), photo: "NEW" };
    expect(preservePhoto(incoming, base).photo).toBe("NEW");
  });
});

describe("mergeTailored (anti-wipe)", () => {
  const base: Resume = normalizeResume({
    name: "Alice",
    experience: [{ title: "Dev", bullets: ["a"] }],
    languages: [{ name: "FR", level: "Natif" }],
    interests: ["Lecture"],
    certifications: ["AWS"],
    projects: [{ title: "P1", date: "2024", description: "x" }],
    volunteer: [{ title: "Croix-Rouge", bullets: [] }],
  });

  it("restaure languages/interests même si l'IA les renvoie", () => {
    const tailored = normalizeResume({
      name: "Alice",
      experience: [{ title: "Dev adapté" }],
      languages: [{ name: "EN", level: "Courant" }],
      interests: ["Autre"],
    });
    const merged = mergeTailored(base, tailored);
    expect(merged.languages).toEqual([{ name: "FR", level: "Natif" }]);
    expect(merged.interests).toEqual(["Lecture"]);
  });

  it("restaure projects/certifications/volunteer si l'IA les vide", () => {
    const tailored = normalizeResume({ name: "Alice", experience: [{ title: "Dev" }] });
    const merged = mergeTailored(base, tailored);
    expect(merged.certifications).toEqual(["AWS"]);
    expect(merged.projects).toHaveLength(1);
    expect(merged.volunteer).toHaveLength(1);
  });

  it("lève si la réponse IA vide un CV qui avait un cœur", () => {
    const empty = normalizeResume({});
    expect(() => mergeTailored(base, empty)).toThrow();
  });
});
