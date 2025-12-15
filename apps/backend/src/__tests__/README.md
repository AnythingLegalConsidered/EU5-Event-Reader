# Tests du parser

- **Fixtures** (`fixtures/`) : exemples réalistes de fichiers Paradox (simple, complexe, multiples, syntaxe invalide, encodage).
- **tokenizer.test.ts** : vérifie la découpe des tokens (commentaires, chaînes, nombres, dates).
- **paradox-parser.test.ts** : construit l'AST et gère les clés répétées.
- **event-extractor.test.ts** : transforme l'AST en `ParsedEvent` (namespace, triggers, options).
- **file-reader.test.ts** : gestion d'encodage et erreurs de lecture.
- **event-parser.service.test.ts** : pipeline complet + cache.

Commande :

```bash
pnpm --filter @eu5-reader/backend test
```
