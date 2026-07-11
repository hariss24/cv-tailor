/**
 * Modèles de départ de la bibliothèque lettre/email. Textes pré-rédigés en français,
 * paramétrés par les variables de `render.ts`. Les passages entre crochets [ ] sont
 * à personnaliser une fois par l'utilisateur (son parcours, ses atouts).
 */

export interface MailTemplate {
  id: string;
  name: string;
  letterSubject: string;
  letterGreeting: string;
  letterBody: string;
  letterSignoff: string;
  emailSubject: string;
  emailBody: string;
  updatedAt: number;
}

const SIGNOFF =
  "Je serais ravi d'échanger avec vous pour vous présenter plus concrètement mon parcours.\n\n" +
  "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.";

export const DEFAULT_TEMPLATES: MailTemplate[] = [
  {
    id: "default-candidature",
    name: "Candidature",
    letterSubject: "Candidature au poste de {Poste}",
    letterGreeting: "{M/Mme Nom|Madame, Monsieur},",
    letterBody:
      "Je me permets de vous adresser ma candidature pour le poste de {Poste} au sein de {Entreprise}.\n\n" +
      "[Présentez-vous en 2-3 phrases : votre formation, votre expérience, ce qui vous caractérise. " +
      "Exemple : Diplômé d'un Master en gestion de projet, je combine rigueur d'organisation et goût du terrain.]\n\n" +
      "Ce qui m'attire chez {Entreprise}, c'est [dites pourquoi cette entreprise : son secteur, ses valeurs, " +
      "un projet récent]. Je suis convaincu que [votre atout principal] me permettrait de contribuer rapidement " +
      "à vos équipes.",
    letterSignoff: SIGNOFF,
    emailSubject: "Candidature – {Poste} – {Prénom} {Nom}",
    emailBody:
      "Bonjour {M/Mme Nom},\n\n" +
      "Je me permets de vous adresser ma candidature pour le poste de {Poste} au sein de {Entreprise}.\n\n" +
      "Vous trouverez en pièce jointe mon CV ainsi que ma lettre de motivation.\n\n" +
      "Je reste à votre disposition pour tout échange, par téléphone ou en entretien.\n\n" +
      "Cordialement,\n{Prénom} {Nom}",
    updatedAt: 0,
  },
];
