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
      "Je me permets de vous adresser ma candidature spontanée pour rejoindre " +
      "{Entreprise|votre entreprise} en tant que {Poste|collaborateur investi}.\n\n" +
      "Ce qui me motive, c'est de m'investir durablement dans un projet et d'y apporter autant mon " +
      "savoir-faire que ma façon de travailler : l'écoute, l'envie d'apprendre et le goût du " +
      "collectif. Je suis convaincu que mon engagement peut contribuer concrètement à votre " +
      "croissance.\n\n" +
      "Je reste à votre entière disposition pour en échanger.\n\n" +
      "Bien cordialement,\n\n" +
      "{Prénom} {Nom}",
    updatedAt: 0,
  },
];
