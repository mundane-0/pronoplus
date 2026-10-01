# ProNote+ 📚✨

![ProNote+ Logo](resources/icon.png)

**ProNote+** est une application desktop open-source qui améliore et remplace Pronote avec des fonctionnalités avancées d'analyse des notes, un assistant IA et une interface moderne.

[![GitHub license](https://img.shields.io/github/license/pronote-plus/pronoplus)](https://github.com/pronote-plus/pronoplus/blob/main/LICENSE)
[![Electron](https://img.shields.io/badge/Electron-30.0.0-blue)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.0-blue)](https://www.typescriptlang.org/)

## ✨ Fonctionnalités

### 🔐 **Connexion Pronote**
- Connexion directe à votre compte Pronote
- Support des ENT (Île-de-France, Occitanie, etc.)
- Stockage sécurisé des identifiants (chiffrement AES-256)
- Reconnexion automatique

### 📊 **Tableau de Bord Intelligent**
- Vue d'ensemble de votre scolarité
- Moyenne générale avec tendance
- Prochains devoirs et cours
- Suivi des objectifs et streak
- Widgets personnalisables

### 📈 **Analyse Avancée des Notes**
- **Tableau complet** des notes avec filtres
- **Graphiques interactifs** (évolution, comparaison, radar)
- **Statistiques avancées** (médiane, écart-type, tendances)
- **Simulateur de notes** ("Et si ?")
- **Projections** de fin de trimestre

### 📝 **Gestion des Devoirs**
- Calendrier interactif (vue semaine/mois)
- Rappels de devoirs
- Pièces jointes téléchargeables
- Suivi des devoirs faits

### 🗓️ **Emploi du Temps**
- Affichage semaine/jour
- Détection des trous dans l'emploi du temps
- Cours annulés/modifiés en évidence
- Export en format .ics (Google/Apple Calendar)

### 🤖 **Assistant IA**
- Résumé des cours
- Explications personnalisées
- Génération de quiz de révision
- Conseils d'étude
- Support Ollama (local) et OpenAI

### 🎯 **Objectifs & Gamification**
- Objectifs personnalisables par matière
- Système de badges et achievements
- Streak et suivi des progrès
- Récompenses et motivation

### ⚙️ **Personnalisation**
- Thèmes clair/sombre/système
- Couleurs d'accent personnalisables
- Langues (FR/EN)
- Notifications configurables
- Export des données (CSV, PDF, PNG)

## 🚀 Installation

### Prérequis
- Node.js 18+ et npm
- Git
- Connexion internet pour le premier lancement

### Installation depuis les sources

```bash
# Cloner le repository
git clone https://github.com/pronote-plus/pronoplus.git
cd pronoplus

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Construire l'application
npm run build:linux   # Pour Linux
npm run build:win     # Pour Windows
npm run build:mac     # Pour macOS
```

### Téléchargement des binaires

Visitez [les releases GitHub](https://github.com/pronote-plus/pronoplus/releases) pour télécharger les versions pré-construites :

- **Windows** : `.exe` (installer) ou `.exe` (portable)
- **Linux** : `.AppImage` ou `.deb`
- **macOS** : `.dmg`

## 🏗️ Architecture Technique

### Stack
- **Frontend** : React 18 + TypeScript + Vite
- **UI** : Tailwind CSS + shadcn/ui
- **Graphiques** : Recharts
- **State Management** : Zustand
- **Base de données** : SQLite (better-sqlite3)
- **API Pronote** : pawnote (wrapper Pronote)
- **Build** : Electron + electron-builder
- **CI/CD** : GitHub Actions

### Structure des fichiers
```
pronoplus/
├── src/
│   ├── main/           # Processus principal Electron
│   │   ├── index.ts    # Point d'entrée
│   │   ├── pronote.ts  # Wrapper Pronote API
│   │   ├── database.ts # Base de données SQLite
│   │   └── ipc.ts      # Communication IPC
│   ├── renderer/       # Application React
│   │   ├── pages/      # Pages de l'application
│   │   ├── components/ # Composants réutilisables
│   │   ├── stores/     # Stores Zustand
│   │   └── hooks/      # Hooks personnalisés
│   └── shared/         # Types et utilitaires partagés
├── resources/          # Icônes et assets
└── .github/workflows/  # CI/CD GitHub Actions
```

## 🔧 Développement

### Commandes utiles

```bash
# Développement
npm run dev            # Lance l'application en mode développement

# Build
npm run build          # Build les fichiers source
npm run build:linux    # Build pour Linux
npm run build:win      # Build pour Windows
npm run build:mac      # Build pour macOS
npm run build:all      # Build toutes les plateformes

# Qualité du code
npm run lint           # Vérification ESLint
npm run type-check     # Vérification TypeScript
```

### Variables d'environnement

Créez un fichier `.env` à la racine :

```env
# Pour le développement
NODE_ENV=development
```

### Architecture IPC

L'application utilise le modèle de sécurité d'Electron avec `contextBridge` :

```typescript
// Main process (Node.js)
ipcMain.handle('fetch-grades', () => {
  return pronoteManager.fetchGrades();
});

// Preload script (bridge)
contextBridge.exposeInMainWorld('mainAPI', {
  fetchGrades: () => ipcRenderer.invoke('fetch-grades')
});

// Renderer process (React)
const grades = await window.mainAPI.fetchGrades();
```

## 📦 Build & Distribution

### Configuration electron-builder

```yaml
# electron-builder.yml
appId: com.pronoplus.app
productName: ProNote+
directories:
  output: dist
files:
  - dist/**/*
extraResources:
  - from: resources
    to: resources
```

### GitHub Actions

Le workflow CI/CD automatise :
- Tests et vérifications
- Build multi-plateforme
- Création de releases
- Upload des artefacts

## 🔒 Sécurité

### Protection des données
- **Chiffrement** : Identifiants stockés avec AES-256 via `safeStorage`
- **Local uniquement** : Toutes les données restent sur votre machine
- **Pas de tracking** : Aucune collecte de données personnelles
- **Open source** : Code entièrement auditable

### Authentification Pronote
- Utilisation de la librairie officielle `pawnote`
- Tokens de session sécurisés
- Refresh automatique des sessions
- Gestion des erreurs de connexion

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. **Fork** le projet
2. **Créez une branche** (`git checkout -b feature/ma-feature`)
3. **Commitez vos changements** (`git commit -m 'Ajout de ma feature'`)
4. **Push** (`git push origin feature/ma-feature`)
5. **Ouvrez une Pull Request**

### Standards de code
- TypeScript strict avec ESLint
- Tests unitaires pour les nouvelles fonctionnalités
- Documentation en français
- Commits conventionnels

### Roadmap
- [ ] Support mobile (PWA)
- [ ] Plugins et extensions
- [ ] API publique pour développeurs
- [ ] Synchronisation cloud (optionnel)
- [ ] Analytics anonymes (opt-in)

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **Index Education** pour l'API Pronote
- **Pawnote** pour le wrapper TypeScript
- **Electron** pour le framework desktop
- **Tous les contributeurs** open-source

## 📞 Support

- **Issues GitHub** : [Rapporter un bug](https://github.com/pronote-plus/pronoplus/issues)
- **Discussions** : [Forum GitHub](https://github.com/pronote-plus/pronoplus/discussions)
- **Email** : support@pronote-plus.dev

---

**ProNote+** n'est pas affilié à Index Education ou Pronote. C'est un projet open-source communautaire.

*Fait avec ❤️ par des étudiants pour des étudiants*