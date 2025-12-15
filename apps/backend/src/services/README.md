# Services

## LocalizationService

- Cache multi-langues : `Map<lang, Map<key, value>>` chargé via fichiers `*_l_*.yml`.
- Méthodes clés :
  - `loadLocalizationFile(path)` / `loadLocalizationDirectory(path)`
  - `resolve(key, { language, fallbackLanguage, resolveVariables })`
  - `resolveEvent(parsedEvent, options)` pour enrichir `ParsedEvent` avec textes localisés.
- Fallback : si une clé est absente, fallback langue (défaut `english`), sinon `[MISSING] key`.
- Substitution : `$key$` remplacé récursivement avec garde contre les cycles.

## EventParserService

- Orchestration FileReader → Tokenizer → ParadoxParser → EventExtractor.
- `parseEventFile` + `parseEventDirectory` avec cache mémoire.

## GameDataService

- Découverte des pays via fichiers `flavor_*.txt` d'une source (vanilla/local).
- Cache des événements par pays et cache des pays pour éviter les relectures.
- `getEventsByCountry`, `getLocalizedEventsByCountry`, `getEventById`, `discoverCountries`, `clearCache`.
