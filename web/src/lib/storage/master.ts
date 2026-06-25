import { loadDraft } from "@/lib/storage/db";
import { normalizeResume, isEmptyResume } from "@/lib/resume/normalize";
import type { Resume } from "@/lib/resume/schema";

/**
 * Le CV Maître est persisté comme n'importe quel document, via son brouillon par type
 * (`draft-Maître` en IndexedDB). On le relit ici pour servir de base à l'adaptation.
 */
const MASTER_DRAFT_ID = "draft-Maître";

/** Retourne le CV Maître stocké, ou null s'il n'existe pas / est vide. */
export async function loadMasterResume(): Promise<Resume | null> {
  const draft = await loadDraft(MASTER_DRAFT_ID);
  if (!draft || !draft.json) return null;
  const resume = normalizeResume(draft.json);
  return isEmptyResume(resume) ? null : resume;
}
