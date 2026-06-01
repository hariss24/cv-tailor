# 🤖 CLAUDE.md - Directives pour Claude (et autres IA)

Ce fichier définit les règles de base pour intervenir sur le dépôt `html-to-pdf`.

> **⚠️ IMPORTANT : TOUT EST DOCUMENTÉ DANS `PROJECT_INDEX.md`**  
> Pour comprendre l'architecture complète, la liste des fichiers, la migration HTML -> JSON en cours, et les **"Angles Morts" critiques** à ne pas casser, tu dois **impérativement lire le fichier `PROJECT_INDEX.md`**. Ne commence aucune modification sans avoir pris connaissance des règles métier (notamment la gestion des photos Base64 et du Chat IA) décrites dans ce fichier.

---

## 🛠️ Règles de Développement

1. **Avant de coder, vérifie l'architecture** : L'interface web (`app.js`) et le backend (`app.py`) ont des rôles très stricts. Le rendu HTML se fait côté frontend, le backend ne fait que convertir en PDF.
2. **Ne casse pas la synchro JSON** : Le projet migre vers une source de vérité JSON. Toute nouvelle fonctionnalité IA doit supporter les payloads JSON.
3. **Fichiers lourds** : Gère les optimisations côté frontend (ex: `<canvas>` pour les images) pour soulager les requêtes API Gemini/Anthropic et la base SQLite.

## 🚀 Commandes Essentielles

**Lancement du Serveur Web (Local) :**
```bash
python app.py
```

**Lancement du Serveur FastMCP (Intégration Claude Desktop) :**
```bash
python mcp_server.py
```

**Lancement de la Suite de Tests :**
```bash
pytest
```

**Vérification syntaxique rapide :**
```bash
python -m py_compile app.py archive.py ai_engine.py pdf_engine.py
```

**Installation des dépendances :**
```bash
pip install -r requirements.txt
python -m playwright install chromium
```

## 🔌 Intégration MCP (Claude Desktop)

Ajouter dans `%APPDATA%\Claude\claude_desktop_config.json` :
```json
{
  "mcpServers": {
    "html-to-pdf": {
      "command": "python",
      "args": ["C:\\Users\\tahet\\projects\\html-to-pdf\\mcp_server.py"]
    }
  }
}
```

👉 **Maintenant, lis `PROJECT_INDEX.md` pour l'audit complet du projet !**
