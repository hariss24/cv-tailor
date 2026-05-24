# TODO — html-to-pdf CV Builder

Suivi des fonctionnalités : ce qui est fait, ce qui est prévu, ce qui est en réflexion.

---

## ✅ Fait

### IA & Adaptation
- [x] Chat IA intégré dans l'éditeur (propose / preview / apply)
- [x] 3 niveaux d'adaptation IA : Subtil / Modéré / Hyper-adapté
- [x] Règle anti-détection : interdiction de citer l'entreprise cible
- [x] Règles HTML/CSS strictes sur tous les niveaux (CSS préservé, structure intacte, photo base64 jamais tronquée)
- [x] Restriction du chat IA au périmètre CV/lettre de motivation uniquement
- [x] Possibilité de générer du contenu fictif sur demande explicite
- [x] Modèle Gemini 3.1 Flash Lite (plus rapide)

### Score ATS
- [x] Panneau ATS avec score, mots-clés présents/absents, sections détectées
- [x] Stop words étendus (~100 mots RH génériques filtrés : babyfoot, bienveillance, mutuelle…)
- [x] N-grammes : "machine learning" → `machine-learning`, "react native", "node.js", "ci/cd"…
- [x] Split sur `/` : "React/Node.js" → `react` + `nodejs`
- [x] Détection de sections via balises `<h1>`–`<h6>` (plus de faux positifs sur le texte brut)
- [x] Matching pluriel/singulier (ex: `frameworks` ↔ `framework`)
- [x] Échappement HTML des mots-clés affichés (protection XSS)

### Éditeur & UI
- [x] Éditeur Monaco avec preview HTML en temps réel
- [x] Auto-collapse des images base64 au chargement (évite de noyer l'éditeur)
- [x] Strip base64 des payloads envoyés à l'IA (réduit les tokens consommés)
- [x] Indicateur de chargement animé pendant les appels IA
- [x] Timeout 120s sur les appels Gemini avec message d'erreur clair

### Infrastructure
- [x] Déploiement Vercel (serverless)
- [x] Système de quota / rate limiting
- [x] Archive locale + Vercel Blob Storage
- [x] Historique des CVs avec job_desc associée

---

## 🔵 Priorité haute — à faire

- [ ] **Diff visuel avant/après adaptation IA**
  Montrer côté à côté ce que l'IA a modifié. Indispensable pour valider rapidement une adaptation sans lire tout le CV.

- [ ] **Score ATS piloté par l'IA** (optionnel, côté serveur)
  L'IA extrait les vrais prérequis du poste (hard skills, nice-to-have) et retourne un JSON `{ score, matched_skills, missing_hard_skills }`. Beaucoup plus précis que le matching lexical actuel.

- [ ] **Compteur de tokens estimé** avant envoi
  Les CVs avec photo base64 sont énormes. Afficher "≈ 12 000 tokens" aide l'utilisateur à comprendre sa consommation.

---

## 🟡 Priorité moyenne — bonnes idées

- [ ] **Historique de versions par CV**
  Pouvoir revenir à une version antérieure sans chercher dans l'archive. Utile après une adaptation ratée.

- [ ] **Raccourcis clavier**
  `Ctrl+Enter` = convertir PDF, `Ctrl+S` = sauvegarder brouillon, `Ctrl+Shift+A` = lancer ATS.

- [ ] **Toast notifications**
  Remplacer le `#status` discret par des toasts en bas de l'écran (succès / erreur / info).

- [ ] **Modèle IA upgradeable**
  Permettre de choisir le modèle Gemini (Flash Lite / Flash / Pro) selon le besoin. Pro pour l'adaptation hyper, Lite pour le chat rapide.

- [ ] **Preview page-break**
  Afficher des lignes pointillées sur la preview HTML à chaque saut de page A4 estimé.

---

## 🟢 Idées en réflexion (backlog)

- [ ] Export `.docx` — certains recruteurs exigent encore Word
- [ ] Présets de thème CSS (Moderne / Classique / Minimal) en un clic
- [ ] Champ CSS séparé dans l'éditeur (onglets HTML / CSS)
- [ ] Drag & drop d'un fichier `.html` ou `.md` dans l'éditeur
- [ ] Sidebar "Récents" dans l'éditeur (5 derniers CVs)
- [ ] Toggle `@media print` sur la preview (simuler le rendu PDF)
- [ ] Import depuis LinkedIn (très complexe, dépend de l'API)

---

## ❌ Décidé de ne pas faire (pour l'instant)

- Collaboration temps réel — trop de complexité, usage solo
- Galerie de templates — scope trop large
- Linter CSS print — trop technique pour le public cible

---

*Dernière mise à jour : 2026-05-24*
