import type { Resume } from "@/lib/resume/schema";
import { registerPdfFonts } from "./fonts";
import { GraphiqueTemplate } from "./templates/GraphiqueTemplate";

export type PdfTemplateId = "graphique" | "sobre" | "moderne" | "classique" | "minimal";

export function ResumeDocument({
  resume,
  templateId,
  atsKeywords,
}: {
  resume: Resume;
  templateId: PdfTemplateId;
  atsKeywords?: string[];
}) {
  registerPdfFonts();

  switch (templateId) {
    // Les autres templates seront ajoutés dans les prochaines tâches.
    case "graphique":
    default:
      return <GraphiqueTemplate resume={resume} atsKeywords={atsKeywords} />;
  }
}
