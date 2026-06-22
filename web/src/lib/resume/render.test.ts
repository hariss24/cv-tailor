import { describe, it, expect } from "vitest";
import { renderResume, renderLetter, escapeHtml } from "./render";
import { normalizeResume, normalizeLetter } from "./normalize";

describe("escapeHtml", () => {
  it("échappe & < > \"", () => {
    expect(escapeHtml(`<a href="x">a&b</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;a&amp;b&lt;/a&gt;");
  });
  it("rend '' pour null/undefined", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});

describe("renderResume", () => {
  it("rend le nom et le titre", () => {
    const html = renderResume(normalizeResume({ name: "Alice Martin", title: "Développeuse" }));
    expect(html).toContain("Alice Martin");
    expect(html).toContain("Développeuse");
    expect(html).toContain('class="resume-template-1 resume-template-renderer"');
  });

  it("omet les sections vides", () => {
    const html = renderResume(normalizeResume({ name: "Alice" }));
    expect(html).not.toContain("Expériences");
    expect(html).not.toContain("Compétences");
    expect(html).not.toContain("À propos");
  });

  it("inclut la section Compétences quand elle est remplie", () => {
    const html = renderResume(normalizeResume({ skills: ["JS", "TS"] }));
    expect(html).toContain("Compétences");
    expect(html).toContain("<li class=\"plain-list__item\">JS</li>");
  });

  it("formate une compétence « clé — valeur » en gras", () => {
    const html = renderResume(normalizeResume({ skills: ["Langages — JS, TS"] }));
    expect(html).toContain("<strong>Langages</strong> &mdash; JS, TS");
  });

  it("échappe le XSS dans les champs", () => {
    const html = renderResume(normalizeResume({ name: "<script>alert(1)</script>" }));
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("rend les bullets d'expérience", () => {
    const html = renderResume(
      normalizeResume({ experience: [{ title: "Dev", company: "ACME", bullets: ["A", "B"] }] }),
    );
    expect(html).toContain("Expériences");
    expect(html).toContain("<li>A</li>");
    expect(html).toContain("<li>B</li>");
    expect(html).toContain("ACME");
  });
});

describe("renderLetter", () => {
  it("rend l'objet, la formule d'appel et les paragraphes du corps", () => {
    const html = renderLetter(
      normalizeLetter({ subject: "Candidature", greeting: "Madame,", body: "Para 1\n\nPara 2" }),
    );
    expect(html).toContain("Objet : Candidature");
    expect(html).toContain("Madame,");
    expect(html).toContain("<p>Para 1</p>");
    expect(html).toContain("<p>Para 2</p>");
  });

  it("échappe le XSS dans le corps", () => {
    const html = renderLetter(normalizeLetter({ body: "<img src=x onerror=alert(1)>" }));
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });
});
