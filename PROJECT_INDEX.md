# Index du Projet : html-to-pdf

Ce fichier a été généré pour répertorier l'architecture et catégoriser les fichiers du projet. Il permet de faciliter l'exploration par les IA (comme Gemini ou Claude) en leur donnant un aperçu structuré du code, ce qui économise des tokens et du temps de recherche.

## 🏗️ Architecture Globale

- **Frontend** : Interface native (HTML/JS/CSS) intégrée dans une application Flask. Utilise **Monaco Editor** pour l'édition de code et un `iframe` sandboxté pour la prévisualisation.
- **Backend (Génération PDF)** : Utilise **Playwright** (headless Chromium) via `pdf_engine.py` pour un rendu PDF fidèle au navigateur.
- **Intelligence Artificielle** : Intégration de **Gemini** (via `ai_engine.py`) pour l'adaptation et la réécriture de CV.
- **Déploiement Hybride** : 
  - *Local* : Sauvegarde des fichiers sur le disque dur de l'utilisateur (`~/Documents/CV-Archive/`) et lancement via une UI Tkinter.
  - *Serverless* : Déploiement optimisé pour Vercel ou Render, avec utilisation de Vercel Blob Storage pour conserver l'historique et les PDFs.
- **Intégration Agentique** : Serveur **FastMCP** (`mcp_server.py`) pour interagir localement avec Claude Desktop.

---

## 📂 Répertoire et Catégorisation des Fichiers

### 🌐 Entrées et Routage (Core & Serveur)
*Point d'entrée du serveur web et logique de routage HTTP.*
- **`app.py`** : Cœur de l'application Flask. Gère les routes (`/`, `/convert`, `/api/tailor`), contient les templates HTML de base (sous forme de chaînes brutes `PAGE` et `HISTORY_PAGE` pour éviter les interférences) et lance l'UI de contrôle Tkinter en mode local.
- **`api/index.py`** : Point d'entrée pour le déploiement Serverless sur Vercel. Encapsule `app.py` avec `werkzeug.middleware.dispatcher`.
- **`mcp_server.py`** : Serveur MCP autonome qui expose la conversion PDF comme un "outil" (tool) directement utilisable par Claude Desktop via `stdio`.

### 🧠 Moteurs de Traitement (Engines)
*Logique métier isolée pour la génération de documents et l'IA.*
- **`pdf_engine.py`** : **Unique** point d'interaction avec Playwright. Expose la fonction de rendu synchrone `html_to_pdf_bytes()` qui prend du HTML brut et retourne les octets d'un PDF.
- **`ai_engine.py`** : Moteur de connexion à l'API Gemini. Gère le streaming de complétion, construit les instructions système strictes (règles HTML, limites de longueur) et formatte les payloads.

### 💾 Stockage et Historique
*Gestion de la persistance, locale et cloud.*
- **`archive.py`** : Gère la sauvegarde des PDFs, du code source HTML et de l'historique (`history.json`). S'adapte dynamiquement à l'environnement : disque local ou Vercel Blob Storage (via `BLOB_READ_WRITE_TOKEN`).
- **`quota.py`** : Mécanisme de "Rate Limiting" pour limiter la consommation de l'API Gemini et respecter les quotas journaliers.

### 🎨 Frontend et Interface Utilisateur (`static/`)
*Logique côté client de l'application web.*
- **`static/js/app.js`** : Fichier principal du Frontend. Gère :
  - L'instanciation de **Monaco Editor** et le repliage de code intelligent.
  - La prévisualisation en temps réel via un `iframe`.
  - La gestion des Snapshots locaux (historique brouillon via IndexedDB).
  - La fusion du HTML et du CSS (`_buildTailorPayload`) pour l'envoi optimisé aux API de l'IA sans redondance.
- **`templates/`** : Contient les templates Flask additionnels si le projet s'étend hors des chaînes brutes de `app.py`.

### ⚙️ Configuration et CI/CD
*Fichiers nécessaires à l'installation et au déploiement du projet.*
- **`requirements.txt`** : Dépendances Python (Flask, Playwright, google-genai, mcp, etc.).
- **`.env.example`** : Liste des variables d'environnement requises (clés API, mot de passe remote, tokens Vercel).
- **`Dockerfile` / `render.yaml`** : Fichiers pour le déploiement conteneurisé (ex. Render).
- **`pytest.ini`** : Fichier de configuration pour la suite de tests.

### 📖 Documentation et Gestion de Projet
*Ressources textuelles pour les développeurs et les IA.*
- **`README.md`** : Guide d'installation, usage des modes Local/Remote et fonctionnement général.
- **`CLAUDE.md`** : Directives ultra-importantes pour les assistants IA (architecture, règles de nommage, restrictions de Vercel/Local).
- **`TODO.md`** : Feuille de route du projet, fonctionnalités prévues et progression.
- **`IDEAS.md`** : Backlog d'idées, expérimentations et concepts futurs.

---

## 💡 Guide Rapide de Navigation pour l'IA
* **Pour modifier le design ou l'interaction utilisateur** ➡️ Allez dans `static/js/app.js` et `app.py` (constante `PAGE`).
* **Pour ajuster la génération PDF** ➡️ Allez dans `pdf_engine.py`.
* **Pour modifier la façon dont l'IA adapte le texte** ➡️ Allez dans `ai_engine.py`.
* **Pour comprendre les restrictions de fichiers/stockage** ➡️ Lisez `archive.py` et `CLAUDE.md`.
