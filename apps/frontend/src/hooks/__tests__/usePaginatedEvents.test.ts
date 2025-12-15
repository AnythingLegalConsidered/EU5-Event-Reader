import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { usePaginatedEvents } from '../usePaginatedEvents';
import type { LocalizedEvent } from '@shared';
import { fetchEventsByCountry } from '../../utils/api';

vi.mock('../../utils/api', () => ({
  fetchEventsByCountry: vi.fn()
}));

const mockFetch = vi.mocked(fetchEventsByCountry);

const e = (id: number): LocalizedEvent => ({
  id,
  desc: '',
  title: '',
  namespace: 'ns',
  localizedTitle: `Title ${id}`,
  localizedDesc: '',
  trigger: { condition: 'always' },
  options: []
});

describe('usePaginatedEvents', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('loads pages and accumulates events', async () => {
    mockFetch
      .mockResolvedValueOnce({
        events: [e(1), e(2)],
        pagination: { page: 1, limit: 2, total: 4, totalPages: 2, hasNext: true, hasPrev: false }
      })
      .mockResolvedValueOnce({
        events: [e(3), e(4)],
        pagination: { page: 2, limit: 2, total: 4, totalPages: 2, hasNext: false, hasPrev: true }
      });

    const { result } = renderHook(() => usePaginatedEvents('FRA', 'vanilla', 'english', 2));

    await waitFor(() => expect(result.current.events.length).toBe(2));
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => expect(result.current.events.length).toBe(4));
    expect(result.current.hasMore).toBe(false);
    expect(result.current.pagination?.total).toBe(4);
  });

  it('computes fallback pagination when backend omits meta', async () => {
    mockFetch.mockResolvedValueOnce({
      events: [e(1), e(2)]
    });

    const { result } = renderHook(() => usePaginatedEvents('FRA', 'vanilla', 'english', 3));

    await waitFor(() => expect(result.current.events.length).toBe(2));

    expect(result.current.pagination?.total).toBe(2);
    expect(result.current.pagination?.totalPages).toBe(1);
    expect(result.current.hasMore).toBe(false);
  });
});
