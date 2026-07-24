/**
 * Registre d'écriture demandé à l'IA pour le corps d'une lettre.
 *
 * Séparé de `lib/ai/prompts.ts` pour que l'UI puisse afficher les libellés sans embarquer
 * les prompts (plusieurs dizaines de Ko de texte) dans le bundle client.
 *
 * Le défaut est « humain » : c'est le registre que produisait le chat éditeur quand on lui
 * demandait explicitement « plus authentique, personnel et humain », et le seul que
 * l'adaptation ne savait pas atteindre seule.
 */

export type LetterTone = "humain" | "equilibre" | "factuel";

export const DEFAULT_LETTER_TONE: LetterTone = "humain";

export const LETTER_TONES: { id: LetterTone; label: string; hint: string }[] = [
  {
    id: "humain",
    label: "Authentique",
    hint: "Parle de toi et de ce qui t'anime, comme à l'oral. Les outils viennent en appui, jamais en liste.",
  },
  {
    id: "equilibre",
    label: "Équilibré",
    hint: "Ouvre sur la personne, s'appuie sur des faits du CV. Le registre le plus consensuel.",
  },
  {
    id: "factuel",
    label: "Factuel",
    hint: "Missions, outils et résultats chiffrés. Sobre et direct, sans adjectif sur soi-même.",
  },
];

/** Valide une valeur venue du réseau ou du localStorage. Tout le reste retombe sur le défaut. */
export function parseLetterTone(value: unknown): LetterTone {
  return LETTER_TONES.some((t) => t.id === value) ? (value as LetterTone) : DEFAULT_LETTER_TONE;
}

const STORAGE_KEY = "letterTone";

/** Le registre est un goût personnel, pas un réglage par document : il survit à la session. */
export function loadLetterTone(): LetterTone {
  if (typeof window === "undefined") return DEFAULT_LETTER_TONE;
  return parseLetterTone(window.localStorage.getItem(STORAGE_KEY));
}

export function saveLetterTone(tone: LetterTone): void {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, tone);
}
