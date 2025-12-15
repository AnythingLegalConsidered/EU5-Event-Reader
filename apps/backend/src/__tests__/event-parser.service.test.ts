import path from 'path';
import { describe, expect, it } from 'vitest';
import { EventParserService } from '../services/event-parser.service';

const service = new EventParserService();
const fixturesDir = path.join(__dirname, 'fixtures');

describe('EventParserService', () => {
  it('parses a single event file', async () => {
    const filePath = path.join(fixturesDir, 'simple-event.txt');
    const events = await service.parseEventFile(filePath);
    expect(events.length).toBe(1);
    expect(events[0].id).toBe(100);
  });

  it('caches parsed files', async () => {
    const filePath = path.join(fixturesDir, 'simple-event.txt');
    const first = await service.parseEventFile(filePath);
    const second = await service.parseEventFile(filePath);
    expect(first).toBe(second);
  });

  it('parses directories recursively and skips invalid files', async () => {
    const events = await service.parseEventDirectory(fixturesDir);
    expect(events.length).toBeGreaterThanOrEqual(5);
  });

  it('streams events for large files via generator', async () => {
    const filePath = path.join(fixturesDir, 'flavor_fra.txt');
    const events: any[] = [];
    for await (const evt of service.parseEventFileStreaming(filePath)) {
      events.push(evt);
    }
    expect(events.length).toBeGreaterThan(0);
  });
});
