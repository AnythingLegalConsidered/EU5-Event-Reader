# EU5 Event Reader

**EU5 Event Reader** est une application web conçue pour explorer, visualiser et comprendre les événements du jeu vidéo *Europa Universalis 5* (Project Caesar).

Dans le jeu, les événements sont souvent imprévisibles et leurs conditions d'apparition ou conséquences exactes peuvent être obscures sans fouiller dans les fichiers de script. Cet outil permet de charger les fichiers du jeu (vanilla ou moddés) pour afficher clairement les chaînes d'événements, leurs conditions, leurs effets et leur contexte historique.

![Aperçu de l'application](https://via.placeholder.com/800x400?text=EU5+Event+Reader+Preview)

## 🚀 Fonctionnalités

- **Exploration par Pays** : Sélectionnez un pays (tag) pour voir tous les événements associés.
- **Lecture Claire** : Affichage des événements avec titre, description localisée, options et effets.
- **Chronologie Historique** : Visualisez quand chaque événement est susceptible de se produire historiquement.
- **Arbre de Dépendances** : Comprenez les liens entre événements (quel événement déclenche le suivant, conditions préalables).
- **Support Multi-Sources** : Chargez les événements depuis les fichiers du jeu de base ("vanilla") ou depuis vos propres fichiers locaux.
- **Recherche et Filtres** : Trouvez rapidement un événement par nom, ID ou contenu.

## 🛠️ Architecture Technique

Le projet est structuré comme un monorepo utilisant **pnpm workspaces** :

- **Frontend** (`apps/frontend`) : Application React moderne avec Vite.
  - Virtualisation des listes pour la performance (react-window).
  - Visualisation de graphes et timelines.
  - Gestion d'état optimisée avec caches locaux.

- **Backend** (`apps/backend`) : API Node.js/Express.
  - Parsing performant des fichiers de script Paradox (.txt) via Worker Threads.
  - Système de cache persistant (fichier + mémoire) pour des chargements instantanés.
  - Support de la pagination et de la compression.

- **Shared** (`packages/shared`) : Types et utilitaires partagés entre le front et le back.

## 📦 Installation et Démarrage

### Prérequis
- Node.js (v18+)
- pnpm (activé via `corepack enable`)

### Installation
```bash
# Cloner le dépôt
git clone https://github.com/AnythingLegalConsidered/EU5-Event-Reader.git
cd EU5-Event-Reader

# Installer les dépendances
corepack pnpm install
```

### Lancer en développement
Pour lancer à la fois le backend et le frontend :

1. **Backend** (Port 3000)
   ```bash
   cd apps/backend
   corepack pnpm dev
   ```

2. **Frontend** (Port 5173)
   ```bash
   cd apps/frontend
   corepack pnpm dev
   ```

Ouvrez ensuite [http://localhost:5173](http://localhost:5173) dans votre navigateur.

## 🧪 Tests

Le projet utilise **Vitest** pour les tests unitaires et d'intégration.

```bash
# Lancer tous les tests
corepack pnpm test

# Lancer uniquement les tests frontend
corepack pnpm --filter frontend test

# Lancer uniquement les tests backend
corepack pnpm --filter backend test
```

## 🤝 Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request pour proposer des améliorations.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---
*Note : Ce projet n'est pas affilié à Paradox Interactive.*
