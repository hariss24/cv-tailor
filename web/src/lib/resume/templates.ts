// Identifiants des modèles de CV. Le rendu réel est fait par les templates
// react-pdf (`src/lib/pdfgen/templates/*.tsx`) — plus aucun gabarit HTML/CSS
// depuis la migration React PDF (couche legacy retirée le 17/07/2026).

export type TemplateId = "sobre" | "graphique" | "kakuna" | "marine";

export const TEMPLATE_IDS: readonly TemplateId[] = ["sobre", "graphique", "kakuna", "marine"];
