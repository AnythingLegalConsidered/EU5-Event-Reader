import { useCallback, useEffect, useRef, useState } from 'react';
import { Country, SupportedLanguage } from '@shared';
import { fetchCountries } from '../utils/api';

const cache = new Map<string, Country[]>();

export const useCountries = (source: 'vanilla' | 'local', language?: SupportedLanguage) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const cacheKey = `${source}-${language ?? 'default'}`;

    try {
      const cached = cache.get(cacheKey);
      let nextCountries = cached;
      let fromNetwork = false;

      if (!cached) {
        const fetched = await fetchCountries(source, language);
        cache.set(cacheKey, fetched);
        nextCountries = fetched;
        fromNetwork = true;
      }

      if (nextCountries) {
        const canUpdate = fromNetwork ? isMounted.current : true;
        if (canUpdate) setCountries(nextCountries);
      }
    } catch (err) {
      if (isMounted.current) setError((err as Error).message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [language, source]);

  useEffect(() => {
    isMounted.current = true;
    load();
    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  return { countries, loading, error, refetch: load };
};
