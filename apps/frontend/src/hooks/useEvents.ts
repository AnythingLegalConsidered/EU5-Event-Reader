import { useCallback, useEffect, useRef, useState } from 'react';
import { LocalizedEvent, SupportedLanguage } from '@shared';
import { fetchEventsByCountry } from '../utils/api';

const cache = new Map<string, LocalizedEvent[]>();

export const useEvents = (
  countryTag: string,
  source: 'vanilla' | 'local',
  language: SupportedLanguage
) => {
  const [events, setEvents] = useState<LocalizedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const cacheKey = `${countryTag}-${source}-${language}`;

    try {
      const cached = cache.get(cacheKey);
      let nextEvents = cached;
      let fromNetwork = false;

      if (!cached) {
        const fetched = await fetchEventsByCountry(countryTag, source, language);
        cache.set(cacheKey, fetched.events);
        nextEvents = fetched.events;
        fromNetwork = true;
      }

      if (nextEvents) {
        const canUpdate = fromNetwork ? isMounted.current : true;
        if (canUpdate) setEvents(nextEvents);
      }
    } catch (err) {
      if (isMounted.current) setError((err as Error).message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [countryTag, language, source]);

  useEffect(() => {
    isMounted.current = true;
    void load();
    return () => {
      isMounted.current = false;
    };
  }, [load]);

  return { events, loading, error, refetch: load };
};
