import type { Resume } from "@/lib/resume/schema";

/**
 * Conversion du schéma interne (Resume) vers le standard « JSON Resume » (jsonresume.org),
 * importable par Reactive Resume. Port fidèle de static/js/export-jsonresume.js.
 *
 * Champs volontairement non exportés : photo (base64) et contract (pas d'équivalent standard).
 */

function s(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

/** « 2020 - 2022 » / « Jan 2024 - Présent » → {startDate, endDate}. */
function splitDate(period: string): { startDate: string; endDate: string } {
  const p = s(period);
  if (!p) return { startDate: "", endDate: "" };
  const parts = p.split(/\s*[–—-]\s*/); // tiret, en-dash, em-dash
  if (parts.length >= 2 && s(parts[0])) {
    return { startDate: s(parts[0]), endDate: s(parts.slice(1).join(" - ")) };
  }
  return { startDate: p, endDate: "" };
}

export function resumeToJsonResume(d: Resume) {
  const profiles: { network: string; username: string; url: string }[] = [];
  if (s(d.linkedin)) {
    const raw = s(d.linkedin);
    const url = /^https?:\/\//i.test(raw) ? raw : "https://" + raw;
    profiles.push({ network: "LinkedIn", username: "", url });
  }

  const work = (d.experience ?? [])
    .filter((e) => e && (s(e.title) || s(e.company) || (e.bullets ?? []).length))
    .map((e) => {
      const dt = splitDate(e.date);
      return {
        name: s(e.company),
        position: s(e.title),
        location: s(e.location),
        startDate: dt.startDate,
        endDate: dt.endDate,
        summary: "",
        highlights: (e.bullets ?? []).map(s).filter(Boolean),
        url: "",
      };
    });

  const education = (d.education ?? [])
    .filter((e) => e && (s(e.title) || s(e.school)))
    .map((e) => {
      const dt = splitDate(e.date);
      return {
        institution: s(e.school),
        area: "",
        studyType: s(e.title),
        startDate: dt.startDate,
        endDate: dt.endDate,
        score: "",
        url: "",
        courses: [] as string[],
      };
    });

  const skillNames = (d.skills ?? []).map(s).filter(Boolean);
  const skills = skillNames.length
    ? [{ name: "Compétences", level: "", keywords: skillNames }]
    : [];

  const languages = (d.languages ?? [])
    .filter((l) => l && s(l.name))
    .map((l) => ({ language: s(l.name), fluency: s(l.level) }));

  const interests = (d.interests ?? [])
    .map(s)
    .filter(Boolean)
    .map((name) => ({ name, keywords: [] as string[] }));

  return {
    $schema:
      "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: s(d.name),
      label: s(d.title),
      image: "",
      email: s(d.email),
      phone: s(d.phone),
      url: "",
      summary: s(d.summary),
      location: {
        address: s(d.location),
        postalCode: "",
        city: "",
        countryCode: "",
        region: "",
      },
      profiles,
    },
    work,
    education,
    skills,
    languages,
    interests,
  };
}
