# 📜 WORK_HISTORY.md — Historique de travail (cv-tailor)

> Journal court et à jour de ce qui a été fait, pour qu'une nouvelle session sache
> d'où on part sans relire tout l'historique git ni l'archive complète. **Toute
> session/agent qui termine une tâche notable ajoute une entrée ici** (voir le
> format en bas de fichier) — pas besoin pour un commit trivial.
>
> Le détail exhaustif, phase par phase, des deux grandes réécritures (Next.js puis
> React PDF) est dans `docs/archive/REWRITE_PROGRESS.md` : **figé, ne plus y
> écrire**. N'y aller que si le résumé ci-dessous ne suffit pas.

---

## État actuel

*(une seule ligne, écrasée à chaque mise à jour — pas un historique)*

**Prochaine étape suggérée :** rien d'urgent en cours. Point ouvert dans
`TODO.md` (priorité haute) : « Nettoyage et stabilisation globale — vérifier
l'intégrité de bout en bout post-migration ».

---

## Résumé des chantiers passés (avant ce fichier)

- **Réécriture Next.js** (juin 2026, branche `feature/refonte-ui-nextjs`) : portage
  complet de l'app Flask/Python (rendu HTML + Playwright/Chromium) vers Next.js 16
  + React 19 + TypeScript. TERMINÉE. Incident notable le 24/06 : Gemini (agent de
  secours) a cassé `main` (suppression de `Toolbar.tsx`) — récupéré via reset sur
  `rewrite-nextjs` + sauvegardes (branche `gemini-backup-committed`).
- **Migration React PDF** (2026-07-04 → 2026-07-06, 5 phases) : passage du rendu
  HTML serveur (Playwright/Chromium) au rendu **react-pdf 100 % client**, puis
  démantèlement complet du moteur HTML serveur (`api/convert`, `render.ts`,
  `mergeHtml.ts`, dépendances Playwright/Chromium). TERMINÉE (Phase 5, 2026-07-06,
  144+ tests Vitest + 24 e2e verts). Détail complet dans
  `docs/archive/REWRITE_PROGRESS.md` et `docs/archive/2026-07-0*-react-pdf-phase-*.md`.
- **Grand ménage documentation** (commit `05840ca`, 2026-07-07) : archivage des
  trackers de la migration (`FILE_MAP.md`, `PROJECT_INDEX.md` v1, `SUIVI_TRAVAUX.md`,
  `REWRITE_PROGRESS.md`…) dans `docs/archive/`, `README.md`/`TODO.md` réécrits pour
  pointer vers `web/`.

---

## Journal

### 2026-07-07 : Création de WORK_HISTORY.md
- **Quoi :** Nouveau journal actif à la racine, qui remplace
  `docs/archive/REWRITE_PROGRESS.md` comme cible d'écriture (celui-ci devient une
  archive figée, en lecture seule). Mise à jour de `web/CADRAGE_EXECUTION.md`
  (rules 2 et 11) et de `CLAUDE.md` (racine) pour pointer ici. Note d'archivage
  ajoutée en tête de `REWRITE_PROGRESS.md`.
- **Pourquoi :** `REWRITE_PROGRESS.md` a atteint 420 lignes de détail phase par
  phase — trop volumineux pour servir de point d'entrée rapide en début de
  session. L'historique commit par commit existe déjà dans git ; ce fichier sert
  de résumé narratif, pas de doublon du `git log`.
- **Fichiers touchés :** `WORK_HISTORY.md` (créé), `CLAUDE.md`,
  `web/CADRAGE_EXECUTION.md`, `docs/archive/REWRITE_PROGRESS.md` (note d'en-tête).
- **Résultat vérifs :** N/A (documentation uniquement).

### 2026-07-07 : CLAUDE.md + PROJECT_INDEX.md (racine)
- **Quoi :** Rédaction de `CLAUDE.md` (navigation courte, guidelines Karpathy) et
  `PROJECT_INDEX.md` (architecture, modèle de données, state/stockage Dexie,
  rendu PDF, clients IA, chasseur d'offres France Travail, auth, pièges connus),
  à partir d'une lecture directe du code de `web/` — pas des anciens docs.
- **Pourquoi :** L'ancien `CLAUDE.md` racine (supprimé la veille, voir entrée
  suivante) décrivait encore l'architecture Flask comme actuelle et renvoyait
  vers des fichiers `FILE_MAP.md`/`PROJECT_INDEX.md` inexistants. Aucun document
  d'architecture à jour n'existait pour `web/`.
- **Fichiers touchés :** `CLAUDE.md`, `PROJECT_INDEX.md` (créés).
- **Résultat vérifs :** N/A (documentation uniquement).

### 2026-07-07 : Suppression de l'ancien backend Python/Flask
- **Quoi :** Suppression complète du backend Flask racine (`app.py`,
  `ai_engine.py`, `pdf_engine.py`, `prompts.py`, `scraper.py`, `archive.py`,
  `quota.py`, `mcp_server.py`, `templates/`, `static/`, `tests/` pytest,
  `requirements*.txt`, `Dockerfile`, `render.yaml`, `package.json` racine,
  `node_modules` racine, `.env`/`.env.example` racine, `.vercel/` racine
  dupliqué, ancien `CLAUDE.md`). CI (`.github/workflows/ci.yml`) basculée de
  pytest/ruff vers `npm ci` + `eslint` + `vitest` (elle référençait encore des
  fichiers Python supprimés).
- **Pourquoi :** Ce backend n'était plus référencé par rien depuis la migration
  Next.js (confirmé par `README.md` et l'absence de toute référence dans
  `web/`) ; sa présence à la racine mélangeait code mort et code actuel.
- **Fichiers touchés :** voir commit `5e7c0a6`.
- **Résultat vérifs :** `npm run lint` et `npm test` (177 tests, 30 fichiers)
  verts dans `web/`.
- **Commit :** `5e7c0a6` — chore: suppression complète de l'ancien backend
  Python/Flask.

---

## Format d'une entrée

Nouvelle entrée **en tête** du Journal (ordre antichronologique) :

```
### AAAA-MM-JJ : Titre court
- **Quoi :** ce qui a été fait.
- **Pourquoi :** la raison / le déclencheur.
- **Fichiers touchés :** liste, ou renvoi au commit.
- **Résultat vérifs :** ce qui a été vérifié concrètement (commande + résultat), ou N/A si doc-only.
- **Commit :** hash + message (si applicable).
```
