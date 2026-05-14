# 🏥 Stoky — Système de Gestion de Stock Pharmaceutique avec IA

> Tableau de bord complet pour pharmacies et dépôts médicaux, avec assistant IA médical intégré (RAG + MedGemma).

---

## 📋 Table des matières

- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Architecture technique](#architecture-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Lancement](#lancement)
- [Utilisation](#utilisation)
- [Structure du projet](#structure-du-projet)
- [API Reference](#api-reference)

---

## Présentation

**Stoky** est une application web de gestion de stock pharmaceutique enrichie d'un assistant IA local. L'assistant répond aux questions médicales et commerciales en français et en arabe, en se basant sur vos données produits et factures via une architecture RAG (Retrieval-Augmented Generation).

Tout fonctionne **en local** — aucune donnée ne quitte votre machine.

---

## Fonctionnalités

- 📊 **Tableau de bord** — KPIs en temps réel (produits, stock faible, revenus, factures)
- 📦 **Gestion produits** — ajout, modification, suivi des stocks
- 🧾 **Factures** — création et suivi des factures clients
- 🔄 **Mouvements de stock** — entrées/sorties avec historique
- 🤖 **Assistant IA (RAG)** — questions/réponses en FR et AR via MedGemma + BGE-M3
- 🌐 **Multilingue** — interface FR / AR

---

## Architecture technique

```
Frontend (React/Next.js)
        ↓
Backend (FastAPI)
        ↓
   ┌────┴────┐
SQLite    ChromaDB
(produits) (vecteurs)
        ↓
   Ollama (local)
   ├── medgemma:4b  → Chat IA
   └── bge-m3       → Embeddings
```

| Composant | Rôle |
|-----------|------|
| FastAPI | API REST backend |
| SQLAlchemy | ORM base de données |
| ChromaDB | Base vectorielle (RAG) |
| Ollama | LLM local (medgemma:4b) |
| BGE-M3 | Modèle d'embeddings |
| React/Next.js | Interface utilisateur |

---

## Prérequis

- **macOS** (testé sur Apple Silicon) ou Linux
- **Python 3.11+**
- **Node.js 18+**
- **Ollama** installé → [ollama.com](https://ollama.com)
- **Git**
- RAM recommandée : 8 GB minimum (16 GB pour medgemma:4b)

---

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/VOTRE_USERNAME/stoky.git
cd stoky
```

### 2. Installer Ollama et les modèles

```bash
# Installer Ollama (macOS)
brew install ollama

# Démarrer Ollama
ollama serve

# Dans un autre terminal — télécharger les modèles
ollama pull medgemma:4b
ollama pull bge-m3
```

### 3. Backend Python

```bash
cd opencode-agents

# Créer un environnement virtuel
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

### 4. Frontend

```bash
cd frontend
npm install
```

---

## Lancement

### Terminal 1 — Ollama

```bash
ollama serve
```

### Terminal 2 — Backend

```bash
cd opencode-agents
source venv/bin/activate
uvicorn backend.app.main:app --reload --port 8000
```

### Terminal 3 — Frontend

```bash
cd frontend
npm run dev
```

Accéder à l'application : **http://localhost:3000**

API disponible sur : **http://localhost:8000**

---

## Utilisation

### Assistant IA

1. Cliquer sur **Assistant IA** dans le menu latéral
2. Poser une question en français ou en arabe
3. L'assistant interroge la base de données produits et répond avec contexte

Exemples de questions :
- *"Quels sont les antibiotiques disponibles ?"*
- *"Quel est le stock de Paracetamol 500mg ?"*
- *"ما هي الأدوية المتوفرة للأطفال؟"*

### Indexer vos produits

Après avoir ajouté des produits, indexer pour activer le RAG :

```bash
curl -X POST http://localhost:8000/api/rag/index
```

---

## Structure du projet

```
stoky/
├── opencode-agents/
│   └── backend/
│       └── app/
│           ├── main.py              # Point d'entrée FastAPI
│           ├── database.py          # Config SQLAlchemy
│           ├── models/
│           │   ├── base.py
│           │   └── database.py      # Modèles Product, Invoice...
│           ├── api/
│           │   ├── products.py      # Routes produits
│           │   └── rag.py           # Routes Assistant IA
│           └── services/
│               └── rag_service.py   # RAG pipeline (ChromaDB + Ollama)
├── frontend/
│   ├── components/                  # Composants React
│   ├── pages/                       # Pages Next.js
│   └── package.json
├── requirements.txt
├── .gitignore
└── README.md
```

---

## API Reference

### `POST /api/rag/chat`

Poser une question à l'assistant IA.

**Body:**
```json
{
  "question": "Quels antibiotiques sont disponibles ?",
  "language": "fr"
}
```

**Réponse:**
```json
{
  "answer": "Les antibiotiques disponibles sont : Flagyl, Augmentin...",
  "sources": ["produit_123", "produit_456"]
}
```

Valeurs pour `language` : `"fr"` / `"ar"` / `"en"`

---

### `POST /api/rag/index`

Indexer tous les produits dans ChromaDB.

```bash
curl -X POST http://localhost:8000/api/rag/index
```

---

### `GET /api/health`

Vérifier l'état du service.

```bash
curl http://localhost:8000/api/health
# {"status": "ok", "message": "Service is healthy"}
```

---

## Notes importantes

- Les modèles Ollama sont téléchargés **une seule fois** (~4.5 GB total)
- La base ChromaDB est sauvegardée dans `./chroma_db/` — ne pas supprimer
- Pour réinitialiser l'index RAG : supprimer le dossier `chroma_db/` et relancer `/api/rag/index`

---

## Licence

Usage privé / commercial — tous droits réservés.
