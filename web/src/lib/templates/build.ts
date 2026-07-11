import type { Letter, Resume } from "@/lib/resume/schema";
import { renderTemplate, type TemplateVars } from "./render";
import type { MailTemplate } from "./defaults";

/**
 * Assemble la Letter structurée (rendu PDF) depuis un modèle + variables + CV courant.
 * Le corps du modèle contient déjà la formule d'appel et la signature : `greeting`,
 * `signoff` et `signature` restent vides pour ne pas dupliquer.
 */
export function buildLetterFromTemplate(
  tpl: MailTemplate,
  vars: TemplateVars,
  cv: Resume,
  today: string,
): Letter {
  const city = (cv.location || "").split(",")[0].trim();
  return {
    sender_name: cv.name,
    sender_address: cv.location,
    sender_contact: [cv.email, cv.phone].filter(Boolean).join(" · "),
    date: city ? `${city}, le ${today}` : `Le ${today}`,
    recipient_name: vars["Entreprise"]?.trim() || "À l'attention du responsable du recrutement",
    recipient_service: "Service Recrutement",
    recipient_address: "",
    subject: renderTemplate(tpl.letterSubject, vars),
    greeting: "",
    body: renderTemplate(tpl.letterBody, vars),
    signoff: "",
    signature: "",
  };
}
