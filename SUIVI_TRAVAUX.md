# 📓 Suivi des travaux — cv-tailor (post-réécriture)

> **Journal de bord permanent.** Toute session Claude reprend ici pour savoir où on en est.
> La réécriture Next.js elle-même est archivée dans `REWRITE_PROGRESS.md` (terminée).
> Ce fichier suit **tous les travaux depuis** (features, corrections, déploiements).

## 🔒 Protocole (à respecter à CHAQUE session, sans exception)

1. **Au démarrage** : lire ce fichier (injecté automatiquement par le hook SessionStart) pour reprendre le contexte.
2. **Pendant le travail** : suivre le chantier en cours (section « Chantier en cours »).
3. **Après CHAQUE bloc de travail** : consigner ici, **systématiquement**, sans attendre qu'on le demande :
   - ce qui a été fait (fichiers touchés + détail de la modif),
   - le résultat de la vérification (commande lancée + sortie),
   - la **prochaine action**,
   - tout blocage / décision en attente.
4. **Ne jamais** déclarer une tâche finie sans preuve (commande exécutée, sortie lue).
5. Écrire en français. Ne **jamais** mettre de secret/clé en clair ici (fichier versionné).

---

## 🎯 Chantier : Feature « Offres » (chasseur d'offres intégré)

**Statut : ✅ v1 LIVRÉE & VÉRIFIÉE EN PROD (2026-07-01).** Étapes 1-6 faites, poussées, déployées.
Onglet Offres en ligne : https://cv-tailor-drab-rho.vercel.app/jobs
Prochain chantier possible : nettoyer les e2e préexistants cassés (hors périmètre), ou évolutions SaaS.

### Objectif
Onglet « Offres » dans l'app : bouton « Chercher des offres » → recherche France Travail +
notation IA (score /100) selon le profil de Hariss + temps de trajet (Google Maps) →
cartes d'offres triées par score → bouton « Adapter mon CV » qui enchaîne sur la modale
d'adaptation existante (`TailorModal` → `/api/tailor-resume`). Port du plan Flask
`PLAN_INTEGRATION_BOT.md` (bot `agent-taff`) vers l'architecture Next.js/serverless.

### Décisions validées (brainstorming 2026-07-01)
- **Accès API** : France Travail + Google Maps + Gemini → disponibles (clés fournies, voir « Config »).
- **Déroulement** : **Option A** — piloté par le navigateur. La page orchestre, appelle des
  routes API courtes, affiche la progression, stocke les offres **localement (Dexie)**.
  Pas de tâche de fond serveur, pas de base en ligne (incompatible serverless + inutile en mono-utilisateur).
- **Ampleur** : plafond ~**40 offres notées** par recherche (ajustable), pour préserver le quota Gemini.
- **Profil de recherche & scoring** : **config par défaut = Hariss**, mais **tout paramétrable** via
  une structure typée `JobSearchProfile` passée en argument (adresse, postes visés, modes de transport,
  filtres, seuils, profil candidat). Aucune valeur métier en dur dans la logique. ⚠️ Multi-user NON
  implémenté en v1 (pas d'UI réglages ni comptes) — seulement **préparé** (demande explicite 2026-07-01).
- **Jonction** : « Adapter mon CV » pré-remplit `TailorModal` (via le store) et navigue vers l'éditeur.
- **Sécurité (v1)** : app en accès libre, **1 seul utilisateur pour l'instant → risque accepté**.
  ⚠️ La recherche consomme les clés de Hariss (FT/Maps/Gemini). À protéger avant toute diffusion.
- **Gestion quota Gemini** : en cas de 429, **arrêt propre** du scan (garder les offres déjà notées
  + message), au lieu du retry 65 s du bot (bloquerait la page).

### 🌐 Perspective SaaS (ambition déclarée, HORS périmètre v1)
Hariss veut à terme en faire un SaaS multi-utilisateurs. Implications à garder en tête (ne pas
implémenter maintenant, mais ne pas fermer la porte) :
- Le profil de scoring devra devenir **par utilisateur** (aujourd'hui figé en dur).
- Chaque utilisateur devra fournir **ses propres clés** (ou facturation à l'usage) — les clés de
  Hariss ne doivent pas servir tout le monde.
- Auth réelle (comptes) + stockage par compte. Le stockage local Dexie devra peut-être migrer.
- → Concevoir la logique de scan/scoring dans des modules **isolés et paramétrables** (profil,
  clés passées en argument) plutôt qu'en dur, pour faciliter cette évolution.

### Config (clés — noms seulement, valeurs dans web/.env.local gitignoré + Vercel)
- `GEMINI_API_KEY` (déjà en prod), `FT_CLIENT_ID`, `FT_CLIENT_SECRET`, `GOOGLE_MAPS_API_KEY`
  → ajoutées en variables d'environnement **Vercel (production)** le 2026-07-01.
- ⚠️ Clés postées en clair dans le chat le 2026-07-01 → **recommandé de les régénérer** ; le
  plomberie env-var est en place pour un remplacement rapide.

### Architecture cible (à détailler dans la spec)
- `POST /api/jobs/search` (nodejs) : token FT → fetch offres (mots-clés, IdF, CDI/CDD, <30j) →
  filtre stages/alternances + dédup → renvoie `{offers:[{id,title,company,location,url,jobText}]}`.
- `POST /api/jobs/score` (nodejs) : 1 offre → trajet Google Maps + score Gemini (profil figé) →
  `{score, breakdown, commute}`.
- `lib/jobs/` : logique isolée (mots-clés, filtre, scoring, prompt) — paramétrable pour le SaaS.
- Dexie : table `jobs` (`id,createdAt,title,company,location,commute,score,url,jobText,status`) +
  `jobExists/saveJob/listJobs/setJobStatus`.
- Page `/jobs` + lien TopBar ; store : `pendingJobDesc` pour la jonction TailorModal.
- Var d'env à documenter : FT_CLIENT_ID / FT_CLIENT_SECRET / GOOGLE_MAPS_API_KEY.

### Étapes (checklist — à affiner dans le plan d'implémentation)
- [x] Spec écrite dans `docs/superpowers/specs/2026-07-01-offres-nextjs-design.md` — ⏳ relecture utilisateur en attente.
- [ ] Plan d'implémentation (writing-plans).
- [x] `lib/jobs/` (profil paramétrable, FT, trajet, scoring) + `completeJson` + tests (20 verts).
- [x] Route `/api/jobs/search` + test (+ `resolveProfile`).
- [x] Route `/api/jobs/score` + test.
- [x] Table Dexie `jobs` (db.ts v2) + `jobExists/saveJob/listJobs/setJobStatus` (couverture e2e étape 5).
- [x] Page `/jobs` + cartes + progression + états config + lien TopBar + CSS.
- [x] Jonction « Adapter mon CV » (store `pendingJobDesc` + TailorModal + ActionsBar) — e2e `jobs.spec.ts` (4 verts).
- [x] Doc README (variables d'env FT/Maps/Gemini).
- [x] Push (auto-deploy) + vérif bout-en-bout en prod ✅.

### ➡️ Prochaine action
**Feature Offres v1 terminée et en prod.** Pistes possibles (à décider avec l'utilisateur) :
- Nettoyer les **e2e préexistants cassés** (tailor/editor/ats/pack/import-*) — dette de la refonte UI, hors périmètre Offres.
- Évolutions produit : réglages du profil (adresse/postes/transport) → 1re marche vers le SaaS multi-user.
- Le WIP « CADRAGE » non commité (EditorPane/FormEditor/PackModal/… + `web/CADRAGE_FIXES.md`) reste à trancher.

### 📋 Backlog (demandes utilisateur, à planifier)
- **Suivi des candidatures (onglet Offres)** — demandé le 2026-07-04. But : savoir à quelles offres
  on a réellement postulé. Design pressenti (à brainstormer avant d'implémenter) :
  - Bouton emoji ✅ sur chaque `JobCard` → marque l'offre « postulée » ; bulle/badge « Postulé »
    (même famille visuelle que le badge « Nouveau » existant).
  - **Réutiliser le champ `status` existant** de `JobEntry` (Dexie, déjà indexé : `new/seen/dismissed`)
    en ajoutant un statut `applied` + un horodatage `appliedAt` — pas de nouvelle table.
  - Une offre postulée ne doit plus être re-proposée au scan (déjà le cas via `jobExists`) ni masquée
    par erreur : à séparer visuellement (filtre ou section « Candidatures envoyées », triée par date).
  - Piste bonus : proposer de marquer « postulé » automatiquement après un pack candidature / une
    adaptation lancée depuis cette offre (jonction `pendingJobDesc` existante).
- **Formulaire Lettre vide après insertion du pack** (bug, constaté le 2026-07-04) : `PackModal.loadLetter`
  enregistre `json: null` → l'aperçu affiche la lettre (HTML) mais le formulaire Lettre reste vide.
  Correction pressentie : le pack renvoie aussi la lettre **structurée** (schéma `letterSchema`) pour
  alimenter le formulaire en même temps que l'aperçu.
- **Audit fonctionnel complet** (désynchronisations formulaire/aperçu/Mode Expert + défauts d'affichage,
  parcours navigateur avec captures) — proposé, en attente de go.

### Blocages / décisions en attente
- (aucun pour l'instant)

---

## 🗒️ Journal
- 2026-07-01 — **Cadrage feature Offres + config**. Brainstorming mené (4 décisions validées, cf.
  ci-dessus). Clés FT/Maps/Gemini fournies → `web/.env.local` (gitignoré) créé + `FT_CLIENT_ID`,
  `FT_CLIENT_SECRET`, `GOOGLE_MAPS_API_KEY` ajoutées en env Vercel production (GEMINI déjà présente).
  Vérifié : `git check-ignore` confirme `.env.local` ignoré ; `vercel env ls production` liste les 4 clés.
  Système de suivi mis en place : ce fichier `SUIVI_TRAVAUX.md` + hook SessionStart étendu pour l'injecter.
- 2026-07-01 — **Système de suivi opérationnel + spec Offres**. (1) `SUIVI_TRAVAUX.md` créé (ce fichier) ;
  `.claude/inject-progress.ps1` étendu pour injecter SUIVI + REWRITE archive. Bug rencontré : Windows
  PowerShell 5.1 émettait en cp1252 → JSON corrompu (emojis/accents). Fix : `[Console]::OutputEncoding =
  UTF8` en tête + littéraux ASCII. Vérifié : `powershell -File inject-progress.ps1` → JSON valide, ctx
  ~43 k, SUIVI+Offres+archive présents, emojis/accents OK. Commit `1567c71`. (2) Spec feature Offres
  écrite dans `docs/superpowers/specs/2026-07-01-offres-nextjs-design.md` (objectif, décisions, archi
  lib/jobs + routes + Dexie + jonction, flux, erreurs, sécurité/SaaS, tests). ⏳ En attente de relecture.
- 2026-07-01 — **Spec révisée : paramétrabilité renforcée** (demande explicite). Introduction du type
  `JobSearchProfile` (adresse, postes, modes de transport voiture/vélo/à pied/TC, filtres, seuils,
  profil candidat) + `DEFAULT_PROFILE` (Hariss) unique ; toutes les fonctions `lib/jobs/` prennent le
  profil en argument ; routes via helper `resolveProfile(req)` (défaut aujourd'hui, compte/body demain).
  §7 SaaS détaille les futurs paramètres. Multi-user reste **hors périmètre v1** (YAGNI). Commit spec révisée.
- 2026-07-01 — **Étape 1 (socle lib/jobs)**. Créé `web/src/lib/jobs/` : `profile.ts` (type
  `JobSearchProfile` + `DEFAULT_PROFILE` Hariss, 29 mots-clés, modes transit/vélo/marche, seuils),
  `francetravail.ts` (`getToken` OAuth, `fetchOffers` avec min+maxCreationDate, `isExcluded`, `mapOffer`),
  `maps.ts` (`getCommuteTimes` via Distance Matrix REST + `commuteSummary`), `score.ts` (`scoreOffer` →
  `completeJson`, bornage 0-100). Ajout `completeJson` (Gemini response schema) à `lib/ai/clients.ts`.
  Tests : `francetravail/maps/score.test.ts`. Vérif : `tsc --noEmit` OK, `vitest run` = **164 tests verts**
  (dont 20 nouveaux), 0 régression. Pas de nouvelle dépendance npm (fetch natif).
- 2026-07-01 — **Étape 2 (routes API)**. `web/src/lib/jobs/resolveProfile.ts` (renvoie `DEFAULT_PROFILE`
  aujourd'hui, point d'extension SaaS). `app/api/jobs/search/route.ts` (nodejs : token FT → boucle
  mots-clés → filtre → dédup → `{offers}` ; 400 `config` si clés FT absentes ; 502 si FT échoue).
  `app/api/jobs/score/route.ts` (nodejs : trajet Maps + `scoreOffer` ; `{score,breakdown,commute,commuteText}` ;
  400 `config` si clé Maps absente ; **429** via `aiErrorResponse` si quota Gemini). Tests routes (7).
  Vérif : `tsc` OK, `vitest` (27 verts jobs+routes), `npm run build` OK (routes ƒ enregistrées), `eslint` clean.
- 2026-07-01 — **Étape 3 (Dexie table jobs)**. `web/src/lib/storage/db.ts` : interface `JobEntry`,
  table `jobs` en `version(2).stores({ jobs: "id, score, status, createdAt" })` (tables v1 héritées),
  fonctions `jobExists/saveJob/listJobs(status)/setJobStatus` (style try/catch + console.warn existant).
  Pas de test unitaire Dexie (le projet n'en a pas : pas de fake-indexeddb ; couverture via e2e étape 5).
  Vérif : `tsc` OK, `vitest run` = **171 tests verts**, 0 régression.
- 2026-07-01 — **Étape 4 (jonction « Adapter mon CV »)**. `docStore.ts` : `pendingJobDesc` + `setPendingJobDesc`.
  `TailorModal.tsx` : pré-remplit `jobDesc` depuis `pendingJobDesc` à l'ouverture via le pattern React
  « ajustement d'état au rendu » (suivi de `open`) + consommation du pending dans un effet (setter zustand).
  `ActionsBar.tsx` (monté sur `/`) : ouverture initiale via initialiseur `useState` paresseux + snapshot en effet.
  ⚠️ Contrainte lint React 19 `react-hooks/set-state-in-effect` : interdit `setState` React dans un effet →
  d'où ces deux patterns (init paresseux / ajustement au rendu). Vérif : `eslint` clean, `tsc` OK, `vitest`
  171 verts, `build` OK. (e2e de la jonction à l'étape 5.)
- 2026-07-01 — **Étape 5 (écran /jobs)**. `app/jobs/page.tsx` + `components/jobs/{JobsView,ScanProgress,JobCard}.tsx`
  (scan piloté navigateur : search → dédup Dexie → boucle score jusqu'au plafond → save si ≥ seuil ;
  arrêt propre 429 ; écran config). Lien « Offres » dans `TopBar`. Styles néomorphiques dans `globals.css`.
  **Refactor contrat de données** : `JobOffer` porte `commuteDestination` ; `maps.getCommuteTimes(destination,…)`
  et `score.scoreOffer(offer,…)` opèrent sur l'offre normalisée ; `/api/jobs/search` renvoie aussi
  `scoreLimit`/`minScore` (le client applique les seuils du profil). Tests mis à jour. `TailorModal` :
  init `jobDesc` via initialiseur paresseux (page remontée à la navigation) + consommation du pending en effet.
  Vérif : `tsc` OK, `eslint` clean, `vitest` **171 verts**, `build` OK, **e2e `jobs.spec.ts` 4/4 verts**
  (scan, jonction pré-remplie, masquer, config).
  ⚠️ **e2e préexistants cassés (hors périmètre)** : 8 e2e échouent sur la baseline (`tailor`,`editor`,`ats`,
  `pack`,`import-*`) — vérifié en remisant le WIP : ils échouent AUSSI sans mes changements et sans le WIP
  (ex. `tailor.spec` cherche `.tailor-modal`, classe non appliquée ; `editor.spec` teste `EditorPane` non touché).
  Cassés par la refonte UI antérieure (classes renommées, tests non mis à jour). **Pas des régressions Offres.**
  NB : le working tree contient aussi du WIP « CADRAGE » non commité (EditorPane/FormEditor/PackModal/… +
  `web/CADRAGE_FIXES.md`) NON lié aux Offres → ne pas le committer avec la feature.
- 2026-07-01 — **Étape 6 (doc) + déploiement + VÉRIF PROD ✅**. README : section variables d'env
  (GEMINI/AUTH/FT_CLIENT_ID/FT_CLIENT_SECRET/GOOGLE_MAPS_API_KEY). Poussé toutes les étapes (commits
  `1567c71`→`51664ac`) → auto-deploy Vercel **READY**. **Vérification bout-en-bout sur la prod** :
  `GET /jobs` → 200 ; `POST /api/jobs/search` → 200 en ~9,5 s, **87 offres réelles** France Travail
  (+ scoreLimit 40, minScore 70, commuteDestination lat/lng) ; `POST /api/jobs/score` sur une vraie
  offre → 200 en ~3,5 s, **score 70/100** + breakdown + red flags rédigés + **trajets Google Maps réels**
  (TC 33 min / vélo 24 min / marche 1h07). France Travail + Google Maps + Gemini opérationnels en prod.
  **Feature Offres v1 = LIVRÉE.** (Perf attendue d'un scan complet : ~9 s recherche + 40 × ~3,5 s notation.)
- 2026-07-04 — **Modèle Graphique : titre du poste sous le nom, sans point médian** (retour utilisateur
  avec captures avant/après souhaité). `web/src/lib/resume/templates.ts` (overrides graphique) :
  `title-row` passe de flex ligne (wrap) à **colonne** ; `desired-job-title` en `display: block` ;
  le `::before` « · » remplacé par `content: none` — ⚠️ pas supprimé, car le CSS graphique hérite du
  sobre dont le `::before { content: ", " }` serait réapparu. Vérifié : capture Playwright (modèle
  graphique + titre long : nom sur sa ligne, titre bleu dessous, aucun séparateur), tsc clean,
  184/184 unitaires. Piège Windows rencontré : `.next/dev/types/routes.d.ts` généré corrompu par le
  serveur dev (écriture partielle) → tsc en échec hors code ; purge de `.next/dev/types` (régénéré).
  NB : les CV existants gardent leur CSS enregistré — re-sélectionner « Graphique » dans le menu des
  modèles pour appliquer le correctif à un document déjà créé.
