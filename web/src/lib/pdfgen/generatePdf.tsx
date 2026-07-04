"use client";

import type { Resume } from "@/lib/resume/schema";
import type { PdfTemplateId } from "./ResumeDocument";

/**
 * Génère le PDF du CV **dans le navigateur** (moteur react-pdf).
 * Imports dynamiques : `@react-pdf/renderer` (~centaines de Ko) et le document ne sont
 * chargés qu'au premier appel — rien dans le bundle initial de la page éditeur.
 */
export async function generateResumePdfBlob(
  resume: Resume,
  templateId: PdfTemplateId,
  atsKeywords: string[],
): Promise<Blob> {
  const [{ pdf }, { ResumeDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./ResumeDocument"),
  ]);
  return pdf(
    <ResumeDocument resume={resume} templateId={templateId} atsKeywords={atsKeywords} />,
  ).toBlob();
}
