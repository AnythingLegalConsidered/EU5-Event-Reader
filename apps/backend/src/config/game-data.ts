import fs from 'fs';
import path from 'path';

export type GameDataSource = 'vanilla' | 'local';

const resolvePath = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const resolved = path.resolve(value);
  if (!fs.existsSync(resolved)) {
    console.warn(`Game data path does not exist: ${resolved}`);
  }
  return resolved;
};

const vanillaPath = resolvePath(process.env.VANILLA_EVENTS_PATH);
const localPath = resolvePath(process.env.LOCAL_EVENTS_PATH);

const normalizeSource = (value: string | undefined): GameDataSource =>
  value === 'local' ? 'local' : 'vanilla';

export const gameDataConfig = {
  vanillaPath,
  localPath,
  defaultSource: normalizeSource(process.env.DEFAULT_SOURCE)
};

export const getSourcePath = (source: GameDataSource): string => {
  const selected = source === 'local' ? gameDataConfig.localPath : gameDataConfig.vanillaPath;
  if (!selected) {
    throw new Error(`No path configured for source '${source}'. Set ${
      source === 'local' ? 'LOCAL_EVENTS_PATH' : 'VANILLA_EVENTS_PATH'
    }`);
  }
  return selected;
};
