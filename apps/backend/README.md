# @eu5-reader/backend

API Express pour EU5 Event Reader.

## Scripts

- `pnpm dev` : démarrage avec nodemon + tsx
- `pnpm build` : compilation TypeScript
- `pnpm start` : exécution du build
- `pnpm type-check` : vérification des types

## API Routes

| Endpoint | Method | Description | Query Params | Response |
|----------|--------|-------------|--------------|----------|
| `/api/health` | GET | Health check | – | `{ status: 'ok' }` |
| `/api/countries` | GET | List available countries with localized name and event counts from the configured source | `source` (optional): `vanilla`\|`local`; `language` (optional): `english`\|`french`\|`german`\|`spanish`\|`russian` | `{ source, countries: [{ tag, name, eventCount, namespace? }] }` |
| `/api/events/:country` | GET | Get all localized events for a country tag (3 letters) | `language` (optional), `source` (optional) | `{ country, source, language, events: [LocalizedEvent] }`; `400` on validation errors |
| `/api/event/:id` | GET | Get a single event by `namespace.id` | `language` (optional), `source` (optional) | `{ id, source, language, event }`; `404` if not found; `400` on validation errors |
| `/api/dependencies/:country` | GET | Dependency graphs (flags, temporal gates, event references) for a country’s events | `source` (optional) | `{ country, source, dependencies: [EventDependencyGraph] }`; `400` on validation errors |
| `/api/dependencies/:id` | GET | Dependency graph for a single event (canonical) | `source` (optional) | `{ id, source, graph: EventDependencyGraph }`; `404` if not found; `400` on validation errors |
| `/api/dependencies/event/:id` | GET | Alias for single-event dependency graph | `source` (optional) | `{ id, source, graph: EventDependencyGraph }`; `404` if not found; `400` on validation errors |

Errors: `400` for validation errors, `404` for missing events, `500` for filesystem/access or unexpected errors.

## API Examples

```bash
curl http://localhost:3000/api/countries?source=vanilla
curl "http://localhost:3000/api/events/ARA?language=french&source=vanilla"
curl http://localhost:3000/api/event/flavor_ara.1
```

## Env

Copier `.env.example` vers `.env` puis ajuster :
- `PORT` / `NODE_ENV` : configuration serveur classique.
- `LOCALIZATION_PATH` : dossier des fichiers `*_l_*.yml` à charger au démarrage.
- `VANILLA_EVENTS_PATH` : chemin absolu ou relatif (depuis `apps/backend`) vers les fichiers d'événements vanilla.
- `LOCAL_EVENTS_PATH` : chemin absolu ou relatif vers d'éventuels fichiers d'override locaux.
- `DEFAULT_SOURCE` : `vanilla` (par défaut si non défini) ou `local`, source utilisée par l'API des événements.

L'API des événements lit les fichiers Paradox depuis `VANILLA_EVENTS_PATH` ou `LOCAL_EVENTS_PATH` selon la source demandée.
