import fs from 'fs/promises';
import { createReadStream } from 'fs';
import iconv from 'iconv-lite';

const stripBom = (input: string) => input.replace(/^\uFEFF/, '');

export const readParadoxFile = async (filePath: string): Promise<string> => {
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(filePath);
  } catch (err) {
    throw new Error(`Unable to read file ${filePath}: ${(err as Error).message}`);
  }

  const tryUtf8 = stripBom(buffer.toString('utf8'));
  const utf8Bad = tryUtf8.includes('\uFFFD');

  const decoded = utf8Bad ? iconv.decode(buffer, 'win1252') : tryUtf8;
  return stripBom(decoded).replace(/\r\n/g, '\n');
};

export const readParadoxFileChunked = async function* (
  filePath: string,
  chunkSize = 64 * 1024
): AsyncGenerator<string> {
  const stream = createReadStream(filePath, { highWaterMark: chunkSize });
  let useWin1252 = false;
  for await (const chunk of stream) {
    const buf = chunk as Buffer;
    const utf8 = buf.toString('utf8');
    if (!useWin1252 && utf8.includes('\uFFFD')) {
      useWin1252 = true;
    }
    const decoded = useWin1252 ? iconv.decode(buf, 'win1252') : utf8;
    yield stripBom(decoded).replace(/\r\n/g, '\n');
  }
};
