/**
 * Modèle de départ de la lettre de motivation. Un seul modèle, paramétré par les
 * variables de `render.ts` (`{Variable}` ou `{Variable|repli}`). Le corps contient
 * tout : formule d'appel, texte, formule de politesse et signature.
 */

export interface MailTemplate {
  id: string;
  name: string;
  letterSubject: string;
  letterBody: string;
  updatedAt: number;
}

export const DEFAULT_TEMPLATES: MailTemplate[] = [
  {
    id: "default-candidature",
    name: "Candidature",
    letterSubject: "Candidature spontanée – {Poste} – {Prénom} {Nom}",
    letterBody:
      "Bonjour {M/Mme Nom|Madame, Monsieur},\n\n" +
      "Je me permets de vous adresser ma candidature spontanée pour un poste de {Poste} au sein de {Entreprise}.\n\n" +
      "Motivé à l'idée de m'investir durablement, je suis convaincu que mon profil et mon engagement peuvent contribuer concrètement à vos projets.\n\n" +
      "Vous trouverez mon CV en pièce jointe. Je reste à votre entière disposition pour en échanger.\n\n" +
      "Bien cordialement,\n{Prénom} {Nom}",
    updatedAt: 0,
  },
];
