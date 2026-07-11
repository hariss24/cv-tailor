/**
 * Découpe une chaîne tokenisée (`"Bonjour {M/Mme Nom}, … {Poste}"`) en segments
 * texte / variable, pour l'affichage à étiquettes de `VariableEditor`.
 * Même syntaxe que `render.ts` : `{Variable}` ou `{Variable|repli}`.
 * `raw` conserve le token brut (repli inclus) pour une sérialisation fidèle.
 */
export type TokenSegment =
  | { type: "text"; text: string }
  | { type: "var"; name: string; raw: string };

const TOKEN_RE = /\{([^{}|]+)(?:\|[^{}]*)?\}/g;

export function parseTokens(value: string): TokenSegment[] {
  const segments: TokenSegment[] = [];
  let last = 0;
  for (const m of value.matchAll(TOKEN_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) segments.push({ type: "text", text: value.slice(last, idx) });
    segments.push({ type: "var", name: m[1].trim(), raw: m[0] });
    last = idx + m[0].length;
  }
  if (last < value.length) segments.push({ type: "text", text: value.slice(last) });
  return segments;
}
