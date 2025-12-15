# EU5 Event Reader

**EU5 Event Reader** is a web application designed to explore, visualize, and understand events in the video game *Europa Universalis 5* (Project Caesar).

In the game, events are often unpredictable, and their exact trigger conditions or consequences can be obscure without digging into script files. This tool allows you to load game files (vanilla or modded) to clearly display event chains, their conditions, effects, and historical context.

![Application Preview](https://via.placeholder.com/800x400?text=EU5+Event+Reader+Preview)

## 🚀 Features

- **Country Exploration**: Select a country (tag) to view all associated events.
- **Clear Reading**: Display events with title, localized description, options, and effects.
- **Historical Timeline**: Visualize when each event is historically likely to occur.
- **Dependency Tree**: Understand links between events (which event triggers the next, prerequisites).
- **Multi-Source Support**: Load events from base game files ("vanilla") or your own local files.
- **Search and Filters**: Quickly find an event by name, ID, or content.

## 🛠️ Technical Architecture

The project is structured as a monorepo using **pnpm workspaces**:

- **Frontend** (`apps/frontend`): Modern React application with Vite.
  - List virtualization for performance (react-window).
  - Graph and timeline visualization.
  - Optimized state management with local caches.

- **Backend** (`apps/backend`): Node.js/Express API.
  - High-performance parsing of Paradox script files (.txt) via Worker Threads.
  - Persistent cache system (file + memory) for instant loads.
  - Support for pagination and compression.

- **Shared** (`packages/shared`): Types and utilities shared between frontend and backend.

## 📦 Installation and Startup

### Prerequisites
- Node.js (v18+)
- pnpm (enabled via `corepack enable`)

### Installation
```bash
# Clone the repository
git clone https://github.com/AnythingLegalConsidered/EU5-Event-Reader.git
cd EU5-Event-Reader

# Install dependencies
corepack pnpm install
```

### Run in Development
To run both backend and frontend:

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

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## 🧪 Tests

The project uses **Vitest** for unit and integration tests.

```bash
# Run all tests
corepack pnpm test

# Run only frontend tests
corepack pnpm --filter frontend test

# Run only backend tests
corepack pnpm --filter backend test
```

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or pull request to propose improvements.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---
*Note: This project is not affiliated with Paradox Interactive.*
