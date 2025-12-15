import {
  EventDependency,
  EventDependencyGraph,
  LocalizedEvent,
  TimelineData,
  TimelineEvent
} from '@shared';

const DATE_PATTERN = /^(\d{3,4})\.(\d{1,2})\.(\d{1,2})$/;
const YEAR_PATTERN = /(\d{3,4})/;

const toYear = (value: string): number | undefined => {
  const match = value.match(YEAR_PATTERN);
  if (!match) return undefined;
  const year = Number(match[1]);
  return Number.isNaN(year) ? undefined : year;
};

const normalizeDate = (raw: string): string | undefined => {
  const match = raw.match(DATE_PATTERN);
  if (!match) return undefined;
  const [, y, m, d] = match;
  const pad = (v: string) => v.padStart(2, '0');
  return `${y}.${pad(m)}.${pad(d)}`;
};

type TemporalInfo = { year?: number; date?: string; condition?: string };

export const extractTemporalDate = (
  dependency: EventDependency
): TemporalInfo | null => {
  if (dependency.type !== 'temporal') return null;
  const raw = String(dependency.key ?? '').trim();
  const detail = dependency.details ?? '';

  const lowerRaw = raw.toLowerCase();
  const lowerDetail = detail.toLowerCase();
  if (lowerRaw.includes('years_passed') || lowerDetail.includes('years_passed')) return null;

  const date = normalizeDate(raw);
  const yearFromDate = date ? Number(date.split('.')[0]) : undefined;
  const yearFromRaw = toYear(raw);

  const year = yearFromDate ?? yearFromRaw;

  if (!year && !date) return null;

  return {
    year,
    date: date ?? undefined,
    condition: detail ? `${detail} ${raw}`.trim() : raw
  };
};

const pickBestTemporalDependency = (dependencies: EventDependency[]): TemporalInfo | undefined => {
  const temporalInfos = dependencies
    .filter(dep => dep.type === 'temporal')
    .map(dep => extractTemporalDate(dep))
    .filter((info): info is TemporalInfo => info !== null);

  if (!temporalInfos.length) return undefined;

  const score = (info: TemporalInfo) => (info.date ? 2 : info.year ? 1 : 0);

  return temporalInfos.reduce<TemporalInfo>((best, current) => {
    const bestScore = score(best);
    const currentScore = score(current);
    if (currentScore > bestScore) return current;
    if (currentScore < bestScore) return best;

    const bestYear = best.year ?? Number.POSITIVE_INFINITY;
    const currentYear = current.year ?? Number.POSITIVE_INFINITY;
    if (currentYear < bestYear) return current;
    if (currentYear > bestYear) return best;

    if (best.date && current.date) return current.date < best.date ? current : best;
    if (current.date) return current;
    return best;
  }, temporalInfos[0]);
};

const buildIncomingMap = (graphs: EventDependencyGraph[]) => {
  const incoming = new Map<string, EventDependency[]>();
  for (const graph of graphs) {
    for (const dep of graph.dependencies) {
      if (dep.targetEventId) {
        const key = dep.targetEventId.toLowerCase();
        const list = incoming.get(key) ?? [];
        list.push(dep);
        incoming.set(key, list);
      }
    }
  }
  return incoming;
};

export const buildTimelineData = (
  events: LocalizedEvent[],
  dependencies: EventDependencyGraph[]
): TimelineData => {
  const eventMap = new Map<string, LocalizedEvent>();
  events.forEach(evt => {
    const id = `${evt.namespace}.${evt.id}`.toLowerCase();
    eventMap.set(id, evt);
  });

  const graphMap = new Map<string, EventDependencyGraph>();
  dependencies.forEach(graph => {
    graphMap.set(graph.eventId.toLowerCase(), graph);
  });

  const incomingMap = buildIncomingMap(dependencies);
  const timelineEvents: TimelineEvent[] = [];

  graphMap.forEach((graph, key) => {
    const event = eventMap.get(key);
    if (!event) return;

    const temporalData = pickBestTemporalDependency(graph.dependencies);

    if (!temporalData) return;

    const eventId = graph.eventId;
    const incoming = incomingMap.get(eventId.toLowerCase()) ?? [];
    timelineEvents.push({
      eventId,
      namespace: graph.namespace,
      event,
      temporalData,
      dependencies: {
        incoming,
        outgoing: graph.dependencies
      }
    });
  });

  const years = timelineEvents
    .map(evt => evt.temporalData?.year)
    .filter((y): y is number => typeof y === 'number');

  const dateRange = {
    min: years.length ? Math.min(...years) : undefined,
    max: years.length ? Math.max(...years) : undefined
  };

  return { events: sortEventsByDate(timelineEvents), dateRange };
};

export const sortEventsByDate = (events: TimelineEvent[]): TimelineEvent[] => {
  const toComparable = (evt: TimelineEvent) => {
    const year = evt.temporalData?.year ?? Number.POSITIVE_INFINITY;
    const date = evt.temporalData?.date ?? '';
    return { year, date };
  };

  return [...events].sort((a, b) => {
    const aComp = toComparable(a);
    const bComp = toComparable(b);
    if (aComp.year !== bComp.year) return aComp.year - bComp.year;
    if (aComp.date && bComp.date) return aComp.date.localeCompare(bComp.date);
    if (aComp.date) return -1;
    if (bComp.date) return 1;
    return 0;
  });
};
