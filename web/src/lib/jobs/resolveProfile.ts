import { parseProfile } from "./profileSchema";
import type { JobSearchProfile } from "./profile";

/**
 * Résout le profil de recherche pour une requête.
 *
 * **Point d'extension multi-utilisateur** : aujourd'hui, le profil arrive dans le
 * corps de la requête (mode local, persisté côté navigateur). Demain (SaaS), cette
 * fonction lira d'abord la session du compte ; les modules `lib/jobs/` reçoivent
 * déjà le profil en argument, donc rien d'autre ne changera.
 *
 * @param body corps JSON déjà parsé de la requête (`{ profile?, ... }`).
 */
export function resolveProfile(body?: unknown): JobSearchProfile {
  const profile = (body && typeof body === "object") ? (body as { profile?: unknown }).profile : undefined;
  return parseProfile(profile);
}
