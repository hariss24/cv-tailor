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
    id: "default-spontanee",
    name: "Candidature spontanée",
    letterSubject: "Candidature spontanée – {Poste}",
    letterGreeting: "{M/Mme Nom|Madame, Monsieur},",
    letterBody:
      "Je me permets de vous adresser ma candidature spontanée pour un poste de {Poste} au sein de {Entreprise}.\n\n" +
      "[Présentez-vous en 2-3 phrases : votre formation, votre expérience, ce qui vous caractérise. " +
      "Exemple : Diplômé d'un Master en gestion de projet, je combine rigueur d'organisation et goût du terrain.]\n\n" +
      "Ce qui m'attire chez {Entreprise}, c'est [dites pourquoi cette entreprise : son secteur, ses valeurs, " +
      "un projet récent]. Je suis convaincu que [votre atout principal] me permettrait de contribuer rapidement " +
      "à vos équipes.",
    letterSignoff: SIGNOFF,
    emailSubject: "Candidature spontanée – {Poste} – {Prénom} {Nom}",
    emailBody:
      "Bonjour {M/Mme Nom},\n\n" +
      "Je me permets de vous adresser ma candidature spontanée pour un poste de {Poste} au sein de {Entreprise}.\n\n" +
      "Vous trouverez en pièce jointe mon CV ainsi que ma lettre de motivation.\n\n" +
      "Je reste à votre disposition pour tout échange, par téléphone ou en entretien.\n\n" +
      "Cordialement,\n{Prénom} {Nom}",
    updatedAt: 0,
  },
  {
    id: "default-offre",
    name: "Réponse à une offre",
    letterSubject: "Candidature au poste de {Poste}",
    letterGreeting: "{M/Mme Nom|Madame, Monsieur},",
    letterBody:
      "Votre offre pour le poste de {Poste} a retenu toute mon attention, et c'est avec un réel intérêt " +
      "que je vous adresse ma candidature.\n\n" +
      "[Reliez votre parcours aux attentes de l'offre : 2-3 phrases sur votre expérience la plus pertinente, " +
      "avec un exemple concret et si possible un résultat chiffré.]\n\n" +
      "Rejoindre {Entreprise} représenterait pour moi l'opportunité de [ce que le poste vous apporterait " +
      "et ce que vous apporteriez en retour]. Ma disponibilité est immédiate et je serais heureux de vous " +
      "en dire davantage lors d'un entretien.",
    letterSignoff: SIGNOFF,
    emailSubject: "Candidature – {Poste} – {Prénom} {Nom}",
    emailBody:
      "Bonjour {M/Mme Nom},\n\n" +
      "Suite à votre offre pour le poste de {Poste}, je vous adresse ma candidature.\n\n" +
      "Vous trouverez en pièce jointe mon CV ainsi que ma lettre de motivation détaillant mon parcours " +
      "et ma motivation pour rejoindre {Entreprise}.\n\n" +
      "Je reste à votre disposition pour un entretien à votre convenance.\n\n" +
      "Cordialement,\n{Prénom} {Nom}",
    updatedAt: 0,
  },
  {
    id: "default-alternance",
    name: "Alternance",
    letterSubject: "Candidature pour une alternance – {Poste}",
    letterGreeting: "{M/Mme Nom|Madame, Monsieur},",
    letterBody:
      "Actuellement en formation [intitulé de votre formation], je recherche une alternance en tant que " +
      "{Poste} à partir de [date de début], au rythme de [rythme d'alternance].\n\n" +
      "[Présentez vos premiers acquis : projets d'études, stages, compétences déjà mobilisables.]\n\n" +
      "Effectuer mon alternance chez {Entreprise} me permettrait de [ce que vous voulez apprendre] tout en " +
      "apportant à vos équipes [ce que vous savez déjà faire]. Motivé et impliqué, je saurai m'investir " +
      "pleinement dans les missions confiées.",
    letterSignoff: SIGNOFF,
    emailSubject: "Candidature alternance – {Poste} – {Prénom} {Nom}",
    emailBody:
      "Bonjour {M/Mme Nom},\n\n" +
      "Actuellement en formation, je recherche une alternance en tant que {Poste} et je me permets de " +
      "candidater auprès de {Entreprise}.\n\n" +
      "Vous trouverez en pièce jointe mon CV ainsi que ma lettre de motivation précisant mon rythme " +
      "d'alternance et mes disponibilités.\n\n" +
      "Je reste à votre disposition pour tout échange.\n\n" +
      "Cordialement,\n{Prénom} {Nom}",
    updatedAt: 0,
  },
];
