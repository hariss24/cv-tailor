/**
 * Temps de trajet via Google Maps Distance Matrix (API REST). Port de `get_commute_times`
 * (`agent-taff/bot.py`), généralisé à la liste de modes du profil. `fetch` natif, pas de SDK.
 */

import type { CommuteMode, JobSearchProfile } from "./profile";

const MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json";

interface MatrixResponse {
  status?: string;
  rows?: { elements?: { status?: string; duration?: { text?: string } }[] }[];
}

/** Durée d'un mode donné, ou "N/A" / "Erreur". */
async function commuteForMode(
  origin: string,
  destination: string,
  mode: CommuteMode,
  key: string,
): Promise<string> {
  const params = new URLSearchParams({ origins: origin, destinations: destination, mode, key });
  // Le mode transit exige un instant de départ pour être calculé.
  if (mode === "transit") params.set("departure_time", "now");
  try {
    const res = await fetch(`${MATRIX_URL}?${params}`);
    if (!res.ok) return "Erreur";
    const data = (await res.json()) as MatrixResponse;
    const element = data.rows?.[0]?.elements?.[0];
    return element?.status === "OK" ? element.duration?.text ?? "N/A" : "N/A";
  } catch {
    return "Erreur";
  }
}

/**
 * Temps de trajet depuis `profile.homeAddress` vers `destination` (coordonnées ou libellé),
 * pour chaque mode de `profile.commuteModes`. Dict `{ [mode]: durée }` ; tout "N/A" si destination vide.
 */
export async function getCommuteTimes(
  destination: string,
  profile: JobSearchProfile,
  key: string,
): Promise<Partial<Record<CommuteMode, string>>> {
  if (!destination) {
    return Object.fromEntries(profile.commuteModes.map((m) => [m, "N/A"]));
  }
  const entries = await Promise.all(
    profile.commuteModes.map(
      async (mode) => [mode, await commuteForMode(profile.homeAddress, destination, mode, key)] as const,
    ),
  );
  return Object.fromEntries(entries);
}

/** Résumé texte affiché sur la carte (« TC: … | Vélo: … »), tolérant aux modes absents. */
export function commuteSummary(commute: Partial<Record<CommuteMode, string>>): string {
  const parts: string[] = [];
  if (commute.transit) parts.push(`TC: ${commute.transit}`);
  if (commute.bicycling) parts.push(`Vélo: ${commute.bicycling}`);
  if (commute.driving) parts.push(`Voiture: ${commute.driving}`);
  if (commute.walking) parts.push(`Marche: ${commute.walking}`);
  return parts.join(" | ");
}
