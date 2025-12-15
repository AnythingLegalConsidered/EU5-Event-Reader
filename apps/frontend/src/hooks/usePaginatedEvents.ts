import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LocalizedEvent, SupportedLanguage } from '@shared';
import { fetchEventsByCountry } from '../utils/api';
import type { PaginationMeta } from '../types/api';

const pageCache = new Map<string, Map<number, LocalizedEvent[]>>();

// Allows global invalidation of all paginated event pages (used when backend data is refreshed).
export const clearPaginatedEventsCache = () => pageCache.clear();

const buildKey = (country: string, source: 'vanilla' | 'local', language: SupportedLanguage) =>
  `${country.toUpperCase()}-${source}-${language}`;

/**
 * Paginated event loader with in-memory page cache keyed by country/source/language.
 * The per-hook cache is cleared on reset, but a global pageCache persists across hooks until
 * `clearPaginatedEventsCache` is called (e.g., after backend cache flush or data version change).
 */
export const usePaginatedEvents = (
  country: string,
  source: 'vanilla' | 'local',
  language: SupportedLanguage,
  pageSize = 50
) => {
  const cacheKey = useMemo(() => buildKey(country, source, language), [country, language, source]);
  const [events, setEvents] = useState<LocalizedEvent[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const isMounted = useRef(true);
  const loadingAll = useRef(false);
  const hasMoreRef = useRef(true);
  const paginationRef = useRef<PaginationMeta | null>(null);

  const mergePages = useCallback(
    (pageMap: Map<number, LocalizedEvent[]>) => {
      const merged: LocalizedEvent[] = [];
      const seen = new Set<string>();
      [...pageMap.keys()].sort((a, b) => a - b).forEach(p => {
        const items = pageMap.get(p) ?? [];
        for (const evt of items) {
          const id = `${evt.namespace}.${evt.id}`;
          if (seen.has(id)) continue;
          seen.add(id);
          merged.push(evt);
        }
      });
      return merged;
    },
    []
  );

  const loadPage = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const cacheForKey = pageCache.get(cacheKey) ?? new Map<number, LocalizedEvent[]>();
        if (!pageCache.has(cacheKey)) pageCache.set(cacheKey, cacheForKey);

        if (cacheForKey.has(targetPage)) {
          const merged = mergePages(cacheForKey);
          if (isMounted.current) {
            setEvents(merged);
            setPage(targetPage);
            const meta = paginationRef.current;
            const nextHasMore = meta ? meta.hasNext : merged.length >= pageSize * targetPage;
            setHasMore(nextHasMore);
            hasMoreRef.current = nextHasMore;
          }
          return;
        }

        const response = await fetchEventsByCountry(country, source, language, {
          page: targetPage,
          limit: pageSize
        });
        const nextPageEvents = response.events ?? [];
        cacheForKey.set(targetPage, nextPageEvents);
        const merged = mergePages(cacheForKey);
        // Fallback pagination is a safety net; backend is expected to return pagination normally.
        const meta = response.pagination ?? {
          page: targetPage,
          limit: pageSize,
          total: merged.length,
          totalPages: Math.ceil(merged.length / pageSize) || 1,
          hasNext: merged.length >= targetPage * pageSize,
          hasPrev: targetPage > 1
        };

        if (isMounted.current) {
          setPagination(meta);
          paginationRef.current = meta;
          setEvents(merged);
          setPage(targetPage);
          setHasMore(meta.hasNext);
          hasMoreRef.current = meta.hasNext;
        }
      } catch (err) {
        if (isMounted.current) setError((err as Error).message);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    [cacheKey, country, language, mergePages, pageSize, source]
  );

  const loadMore = useCallback(async () => {
    if (loading || !hasMoreRef.current) return;
    await loadPage(page + 1);
  }, [loadPage, loading, page]);

  const reset = useCallback(() => {
    setEvents([]);
    setPage(1);
    setHasMore(true);
    hasMoreRef.current = true;
    setPagination(null);
    paginationRef.current = null;
    pageCache.delete(cacheKey);
  }, [cacheKey]);

  const refresh = useCallback(async () => {
    reset();
    await loadPage(1);
  }, [loadPage, reset]);

  const loadAll = useCallback(async () => {
    if (loadingAll.current) return;
    loadingAll.current = true;
    try {
      let nextPage = page;
      // ensure first page loaded
      if (events.length === 0) {
        await loadPage(1);
        nextPage = 1;
      }
      while (hasMoreRef.current) {
        nextPage += 1;
        await loadPage(nextPage);
      }
    } finally {
      loadingAll.current = false;
    }
  }, [events.length, hasMore, loadPage, page]);

  useEffect(() => {
    isMounted.current = true;
    reset();
    void loadPage(1);
    return () => {
      isMounted.current = false;
    };
  }, [country, language, loadPage, reset, source]);

  return {
    events,
    loading,
    error,
    page,
    hasMore,
    pagination,
    loadMore,
    reset,
    refresh,
    loadAll
  };
};
