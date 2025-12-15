# EU5 Event Reader

Monorepo pnpm pour une application React (frontend) et une API Express (backend) partageant des types/utilitaires communs.

## Structure

```
EU5-Event-Reader/
├── apps/
│   ├── frontend/          # React + Vite
│   └── backend/           # Express + TypeScript
├── packages/
│   └── shared/            # Types et utilitaires communs
├── pnpm-workspace.yaml
├── package.json
├── .gitignore
└── README.md
```

## Installation

```bash
pnpm install
```

## Développement

```bash
pnpm dev            # lance frontend + backend
pnpm dev:frontend   # frontend uniquement
pnpm dev:backend    # backend uniquement
```

## Build et vérifications

```bash
pnpm build          # build récursif
pnpm type-check     # vérif TS (project refs)
pnpm lint           # lint TypeScript/React
```

## Technologies

- React 19 + Vite 7
- Node.js + Express
- TypeScript 5.8
- pnpm workspaces

## Architecture (mermaid)

```mermaid
graph TD
    A[EU5-Event-Reader Root] --> B[apps/]
    A --> C[packages/]
    B --> D[frontend/]
    B --> E[backend/]
    C --> F[shared/]
    D --> D1[React + Vite + TypeScript]
    D --> D2[Port 5173]
    D --> D3[Proxy API vers :3000]
    E --> E1[Node.js + Express + TypeScript]
    E --> E2[Port 3000]
    E --> E3[Routes API /api/*]
    F --> F1[Types partagés]
    F --> F2[Utilitaires communs]
    F --> F3[Constantes]
    D -.référence.-> F
    E -.référence.-> F
    D1 -->|HTTP Requests| E3
    style A fill:#e1f5ff
    style D fill:#61dafb
    style E fill:#68a063
    style F fill:#ffd700
```
