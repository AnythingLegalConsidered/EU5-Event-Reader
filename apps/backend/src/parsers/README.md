# Parser Architecture

Pipeline en trois couches pour les fichiers d'événements Paradox (Clausewitz):

1. **FileReader** (`file-reader.ts`) : lit les fichiers `.txt`, gère l'encodage (UTF-8/Windows-1252), normalise les fins de ligne.
2. **Tokenizer** (`tokenizer.ts`) : découpe le texte en tokens (identifiants, chaînes, nombres, dates, booléens, opérateurs, accolades, commentaires) avec positions.
3. **ParadoxParser** (`paradox-parser.ts`) : construit un AST de blocs imbriqués.
4. **EventExtractor** (`event-extractor.ts`) : transforme l'AST en objets `ParsedEvent` typés.

## Usage rapide

```ts
import { readParadoxFile } from './file-reader';
import { Tokenizer } from './tokenizer';
import { ParadoxParser } from './paradox-parser';
import { EventExtractor } from './event-extractor';

const content = await readParadoxFile('path/to/event.txt');
const tokens = new Tokenizer().tokenize(content);
const ast = new ParadoxParser().parse(tokens);
const events = new EventExtractor().extract(ast);
```

## Limitations connues

- Le tokenizer ignore certains symboles exotiques non présents dans les fichiers EU5 classiques.
- Le parser traite les clés répétées comme des tableaux; les cas où l'ordre compte explicitement ne sont pas encore gérés.
- L'extracteur se concentre sur les blocs `*_event`; d'autres types Clausewitz peuvent nécessiter des adaptations.

## LocalizationParser

- Format attendu : fichiers `.yml` Paradox de localisation (`l_<lang>:` en première ligne) encodés en UTF-8-BOM.
- Chaque ligne suivante : `key: "value"`, commentaires `#` ignorés.
- Substitution de variables `$key$` gérée au niveau du service.
- Limites : pas de support YAML générique, uniquement le sous-ensemble Paradox; multi-lignes complexes non pris en charge pour l'instant.
