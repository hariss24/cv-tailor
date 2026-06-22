# Suivi du chantier — Réécriture Next.js (loop autonome)

> Fichier d'état du `/loop` autonome. **Toute session reprend ici.**
> Plan complet : `C:\Users\tahet\.claude\plans\kind-prancing-wand.md`

## Protocole du loop (à suivre à CHAQUE réveil)

1. Lire ce fichier + le plan.
2. Regarder la section **« Prochaine action »** ci-dessous.
3. Faire **une étape** (ou un morceau d'étape si c'est long). Travailler dans `web/`.
4. **Vérifier** concrètement (commande lancée, sortie lue) — pas de « c'est fait » sans preuve.
5. **Commit** le travail (uniquement `web/**` et ce fichier — voir règles ci-dessous).
6. Mettre à jour ce fichier : cocher l'étape, écrire la nouvelle « Prochaine action » et tout blocage.
7. Reprogrammer le prochain réveil (ScheduleWakeup).

## Règles strictes

- **Branche** : `rewrite-nextjs`. Ne pas merger dans `main`.
- **Commits** : commiter SEULEMENT `web/**` et `REWRITE_PROGRESS.md` (chemins explicites :
  `git add web REWRITE_PROGRESS.md`). **NE PAS** commiter les fichiers racine modifiés
  hors-chantier (`app.js`, `ci.yml`, `package.json` racine, `tests/`, `static/`…) : ce sont
  des modifs Phase 3 non validées par l'utilisateur, les laisser tranquilles.
- Messages de commit en français, préfixe `web:` (ex. `web: phase 0 — scaffold Next.js`).
- Contraintes métier du projet (CLAUDE.md) à respecter dans le code écrit : jamais
  `alert/confirm/prompt` natifs ; strip/restore base64 porté à l'identique ; conserver
  l'équivalent `/api/tailor` en plus de `/api/tailor-resume` ; `@google/genai` + modèle
  `gemini-3.1-flash-lite` ; anti-wipe (préserver languages/interests/certifs/projects/volunteer) ;
  anti-détection (jamais le nom de l'entreprise ciblée) ; photo base64 jamais envoyée à l'IA.
- Si un blocage nécessite une décision humaine : l'écrire dans **« Blocages »**, sauter à une
  autre tâche faisable de la même phase si possible, sinon s'arrêter proprement.

---

## Prochaine action
➡️ **Phase 2 (suite) — Aperçu live** : composant `PreviewPane` (client) qui lit le store
(`useDocStore`), construit le document complet `mergedHtml = <html><style>{css}</style>{html}` et
l'affiche dans une **iframe sandbox** (`sandbox="allow-same-origin"`, `srcDoc`), avec un debounce.
Brancher l'aperçu dans `page.tsx` (remplacer le placeholder de droite). Bonus si rapide : compteur de
pages A4. Port de `mergedHtml()`/`schedulePreview()`/`updatePageCount()` (app.js). Vérif :
`npm run dev` (depuis `web/`) → l'aperçu affiche le CV par défaut ; `npm run build` vert.
Ensuite : formulaire par sections (étape 3), puis onglets/Monaco/docType/template/dialogs (étape 4).
⚠️ Toujours `cd web` avant npm. `page.tsx` devient client (`"use client"`) ou garde un wrapper client.

## État des phases

- [x] **Phase 0 — Scaffold & thème** : ✅ scaffold (Next 16.2.9 / React 19.2.4 / Tailwind v4) +
      thème néomorphique porté dans `globals.css` (variables + ombres + `[data-theme=dark]`),
      polices Inter + JetBrains Mono via `next/font`, layout de base (topbar + toolbar + split
      éditeur/aperçu placeholders), `turbopack.root` fixé. `npm run build` vert sans warning.
- [x] **Phase 1 — Domaine CV** : `lib/resume/` complet. ✅ `schema.ts` (zod 4.4.3). ✅ `normalize.ts`
      (unwrap, normalizeResume, normalizeLetter, isEmptyResume, preservePhoto, mergeTailored anti-wipe).
      ✅ `render.ts` (renderResume/renderLetter + escapeHtml). ✅ `templates.ts` (5 modèles sobre/moderne/
      classique/minimal/graphique portés de TEMPLATES, typés `Record<TemplateId, Template>`).
      **28 tests Vitest verts**, `tsc --noEmit` vert.
- [~] **Phase 2 — Éditeur & formulaire** : store zustand, formulaire par sections, Monaco
      (`@monaco-editor/react`), aperçu live, onglets form/HTML/CSS, switch docType, dialogs/toasts.
      ✅ étape 1 : store `state/docStore.ts` (doc html/css/json/docType/templateId + setters, re-render
      via lib/resume) + config Vitest alias `@/` + 5 tests (33 verts au total). ⏳ aperçu, formulaire, Monaco.
      Vérif finale : Playwright (saisie→aperçu, CV↔Lettre, form↔expert, 0 erreur console).
- [ ] **Phase 3 — Conversion PDF** : `lib/pdf/` (playwright-core + @sparticuz/chromium),
      `api/convert`, téléchargement, whitelist formats/marges, anti-SSRF. Vérif : PDF téléchargé correct.
      ⚠️ Risque n°1 : Chromium serverless Vercel — valider tôt.
- [ ] **Phase 4 — Couche IA serveur** : `lib/ai/` (clients Gemini/Anthropic, prompts portés de
      prompts.py), routes `tailor-resume`/`tailor`/`editor-chat`/`ats-score`/`generate-pack`/
      `text-to-html`/`pdf-to-resume`/`extract-job`/`status`, streaming. Vérif : Vitest IA mockée.
- [ ] **Phase 5 — Flux IA frontend** : `lib/ai/base64.ts` (strip/restore fidèle), modals adaptation/
      chat/ATS/pack, imports texte/PDF, extraction URL, diff. Vérif : Playwright backend mocké.
- [ ] **Phase 6 — Persistance navigateur** : `lib/storage/` (Dexie : snapshots max 20, brouillons,
      historique), page `/history`. Vérif : snapshot→restauration fidèle.
- [ ] **Phase 7 — Sécurité** : scraper porté (anti-SSRF + Jina fallback), auth remote (middleware),
      en-têtes durcissement, timeouts. Vérif : URL interne rejetée, login rate-limit.
- [ ] **Phase 8 — Tests, CI, déploiement** : Vitest + Playwright, job CI `web`, déploiement Vercel
      (vérifier surtout le PDF en prod). Bascule depuis Flask hors périmètre.

## Blocages
_(aucun pour l'instant)_

## Journal
- 2026-06-22 — Setup loop + Phase 0 scaffold (`create-next-app web/`, build vert) — commit `web: phase 0 — scaffold Next.js`
- 2026-06-23 — Phase 0 terminée : thème néo porté (`globals.css`), polices `next/font` (Inter + JetBrains Mono), layout de base (topbar/toolbar/split), `turbopack.root` fixé — build vert sans warning
- 2026-06-23 — Phase 1 démarrée : `lib/resume/schema.ts` (zod installé, schéma CV/Lettre + défauts + types) — `tsc --noEmit` vert
- 2026-06-23 — Phase 1 : `lib/resume/normalize.ts` (unwrap + normalize + anti-wipe `mergeTailored`) + Vitest installé, `normalize.test.ts` (15 tests verts), script `npm run test`
- 2026-06-23 — Phase 1 : `lib/resume/render.ts` (renderResume/renderLetter + escapeHtml) + `render.test.ts` — 25 tests verts au total, tsc OK
- 2026-06-23 — **Phase 1 terminée** : `lib/resume/templates.ts` (5 modèles portés de TEMPLATES app.js, typés) + `templates.test.ts` — 28 tests verts, tsc OK
- 2026-06-23 — Phase 2 étape 1 : store `state/docStore.ts` (zustand 5) + `vitest.config.ts` (alias `@/`) + `docStore.test.ts` — 33 tests verts, tsc OK
