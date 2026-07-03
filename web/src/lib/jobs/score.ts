/**
 * Notation d'une offre sur 100 via Gemini (sortie JSON structurée). Port de `score_offer`
 * (`agent-taff/bot.py`). Le profil candidat et le barème viennent du `JobSearchProfile`
 * (paramétrable), pas d'un prompt figé.
 */

import { Type, type Schema } from "@google/genai";
import { completeJson } from "@/lib/ai/clients";
import { parseAiJson } from "@/lib/ai/json";
import type { CommuteMode, JobSearchProfile, ScoringCriterion } from "./profile";
import type { JobOffer } from "./francetravail";

/** Champs d'offre nécessaires au scoring (sous-ensemble de JobOffer). */
export type ScorableOffer = Pick<JobOffer, "title" | "company" | "jobText">;

export interface JobScore {
  score_tech: number;
  score_seniority: number;
  score_sector: number;
  score_geo: number;
  score_red_flags: number;
  total_score: number;
  red_flags_reasons: string[];
}

const SCORE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    score_tech: { type: Type.INTEGER },
    score_seniority: { type: Type.INTEGER },
    score_sector: { type: Type.INTEGER },
    score_geo: { type: Type.INTEGER },
    score_red_flags: { type: Type.INTEGER },
    total_score: { type: Type.INTEGER },
    red_flags_reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "score_tech",
    "score_seniority",
    "score_sector",
    "score_geo",
    "score_red_flags",
    "total_score",
    "red_flags_reasons",
  ],
};

const MODE_LABELS: Record<CommuteMode, string> = {
  transit: "Transports en commun",
  driving: "Voiture",
  bicycling: "Vélo",
  walking: "Marche",
};

/** Bloc « temps de trajet » injecté dans le prompt. */
function commuteInfo(
  commute: Partial<Record<CommuteMode, string>>,
  homeAddress: string,
): string {
  const lines = (Object.keys(commute) as CommuteMode[]).map(
    (mode) => `- ${MODE_LABELS[mode]}: ${commute[mode] ?? "N/A"}`,
  );
  return `Temps de trajet estimé depuis domicile (${homeAddress}):\n${lines.join("\n")}`;
}

function toInt(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

/** Barème structuré → lignes du prompt (`score_<key> (0-<max>) : <description>`). */
export function criteriaPromptLines(criteria: ScoringCriterion[]): string {
  return criteria.map((c) => `score_${c.key} (0-${c.max}) : ${c.description}`).join("\n");
}

/** Note une offre pour le profil donné. `key` optionnelle : sinon clé Gemini serveur (env). */
export async function scoreOffer(
  offer: ScorableOffer,
  commute: Partial<Record<CommuteMode, string>>,
  profile: JobSearchProfile,
  key?: string | null,
): Promise<JobScore> {
  const title = offer.title ?? "";
  const company = offer.company || "Inconnue";
  const description = (offer.jobText ?? "").slice(0, profile.maxDescriptionChars);

  const system =
    "Tu es un recruteur expert. Évalue cette offre pour le candidat suivant :\n" +
    `${profile.candidateSummary}\n\n` +
    "Évalue sur 100 :\n" +
    criteriaPromptLines(profile.scoringCriteria);

  const prompt =
    `Titre: ${title}\nEntreprise: ${company}\n` +
    `${commuteInfo(commute, profile.homeAddress)}\nDescription:\n${description}`;

  const raw = await completeJson(prompt, system, SCORE_SCHEMA, key);
  const data = parseAiJson(raw) as Partial<JobScore>;

  return {
    score_tech: toInt(data.score_tech),
    score_seniority: toInt(data.score_seniority),
    score_sector: toInt(data.score_sector),
    score_geo: toInt(data.score_geo),
    score_red_flags: toInt(data.score_red_flags),
    total_score: Math.max(0, Math.min(100, toInt(data.total_score))),
    red_flags_reasons: Array.isArray(data.red_flags_reasons)
      ? data.red_flags_reasons.filter((r): r is string => typeof r === "string")
      : [],
  };
}
