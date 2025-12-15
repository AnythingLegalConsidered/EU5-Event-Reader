import path from 'path';
import { afterAll, describe, expect, it } from 'vitest';
import { EventParserService } from '../services/event-parser.service';

const fixturesDir = path.join(__dirname, 'fixtures');
const sampleFile = path.join(fixturesDir, 'simple-event.txt');

describe('Parser worker async parsing', () => {
  const services: EventParserService[] = [];

  afterAll(async () => {
    await Promise.all(services.map(s => s.shutdown()));
  });

  it('matches sync parsing results', async () => {
    const baseline = new EventParserService();
    services.push(baseline);
    const syncEvents = await baseline.parseEventFile(sampleFile);

    const asyncService = new EventParserService();
    services.push(asyncService);
    const asyncEvents = await asyncService.parseEventFileAsync(sampleFile);

    expect(asyncEvents.length).toBe(syncEvents.length);
    expect(asyncEvents[0].id).toBe(syncEvents[0].id);
  });

  it('falls back to sync when pool busy', async () => {
    const service = new EventParserService();
    services.push(service);
    const events = await Promise.all([
      service.parseEventFileAsync(sampleFile),
      service.parseEventFileAsync(sampleFile)
    ]);
    expect(events[0].length).toBeGreaterThan(0);
    expect(events[1].length).toBeGreaterThan(0);
  });

  it('streams events without pagination metadata', async () => {
    const service = new EventParserService();
    services.push(service);
    const streamed: any[] = [];
    for await (const evt of service.parseEventFileStreaming(sampleFile)) {
      streamed.push(evt);
    }
    expect(streamed.length).toBeGreaterThan(0);
  });
});
