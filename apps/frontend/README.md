# @eu5-reader/frontend

Application React + Vite.

## Scripts

- `pnpm dev` : démarre Vite
- `pnpm build` : build production
- `pnpm preview` : prévisualise le build
- `pnpm type-check` : vérifie les types

## Aliases

- `@/` → `./src`
- `@shared/` → `../../packages/shared/src`

## Env

Copier `.env.example` vers `.env.local` ou `.env` et définir `VITE_API_URL`.

## Timeline View

Une vue Timeline interactive affiche les événements avec des données temporelles extraites des dépendances (`temporal`).

- Chargement via `useDependencies` (GET `/api/dependencies/:country`) puis transformation avec `buildTimelineData`.
- Interactions : zoom +/- (CSS `transform: scale()`), scroll natif, clic sur un événement pour afficher `EventDetail`, toggle horizontal/vertical.
- Formats temporels supportés : année (`year >= 1500`) ou date précise (`YYYY.MM.DD`). Les dépendances `years_passed` sont ignorées pour l'affichage.
- Les événements sans date temporelle ne s’affichent pas dans la timeline.
