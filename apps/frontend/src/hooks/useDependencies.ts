import { useCallback, useEffect, useRef, useState } from 'react';
import { EventDependencyGraph, SupportedLanguage } from '@shared';
import { fetchDependenciesByCountry } from '../utils/api';

const cache = new Map<string, EventDependencyGraph[]>();

export const useDependencies = (
  countryTag: string,
  source: 'vanilla' | 'local',
  language?: SupportedLanguage
) => {
  const [dependencies, setDependencies] = useState<EventDependencyGraph[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const cacheKey = `${countryTag}-${source}-${language ?? 'any'}`;

    try {
      const cached = cache.get(cacheKey);
      let next = cached;
      let fromNetwork = false;

      if (!cached) {
        const fetched = await fetchDependenciesByCountry(countryTag, source, language);
        cache.set(cacheKey, fetched);
        next = fetched;
        fromNetwork = true;
      }

      if (next) {
        const canUpdate = fromNetwork ? isMounted.current : true;
        if (canUpdate) setDependencies(next);
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

  return { dependencies, loading, error, refetch: load };
};
