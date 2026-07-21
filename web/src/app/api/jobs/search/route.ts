import { NextResponse } from "next/server";
import { resolveProfile } from "@/lib/jobs/resolveProfile";
import { getToken, fetchOffers, isExcluded, mapOffer, type JobOffer } from "@/lib/jobs/francetravail";
import { matchesIncludeKeywords } from "@/lib/jobs/includeFilter";

// France Travail (fetch + OAuth) : runtime Node.js.
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Recherche les offres pour le profil courant : jeton FT, une requête par mot-clé, filtre
 * stages/alternances, dédoublonnage par id, description tronquée. Réponse `{ offers }`.
 * Clés France Travail absentes → 400 `{ error: "config" }` (l'onglet affiche l'invite de config).
 */
export async function POST(req: Request): Promise<Response> {
  const clientId = process.env.FT_CLIENT_ID;
  const clientSecret = process.env.FT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "config", message: "Configurez FT_CLIENT_ID et FT_CLIENT_SECRET pour rechercher des offres." },
      { status: 400 },
    );
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // corps vide/invalide toléré → profil neutre
  }
  const profile = resolveProfile(body);

  try {
    if (profile.keywords.length === 0) {
      return NextResponse.json({ offers: [] });
    }

    const token = await getToken(clientId, clientSecret);
    const seen = new Set<string>();
    const offers: JobOffer[] = [];

    for (const keyword of profile.keywords) {
      const raw = await fetchOffers(token, keyword, profile);
      for (const offer of raw) {
        const id = offer.id ?? "";
        if (!id || seen.has(id)) continue;
        seen.add(id);
        if (isExcluded(offer, profile.excludedWords)) continue;
        const mapped = mapOffer(offer, profile.maxDescriptionChars);
        if (!matchesIncludeKeywords(mapped, profile.includeKeywords)) continue;
        offers.push(mapped);
      }
    }
    return NextResponse.json({ offers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Échec de la recherche d'offres.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
