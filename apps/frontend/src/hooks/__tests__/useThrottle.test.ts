import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useThrottle } from '../useThrottle';

vi.useFakeTimers();

describe('useThrottle', () => {
  it('throttles rapid updates', () => {
    const { result, rerender } = renderHook(({ value }) => useThrottle(value, 100), {
      initialProps: { value: 1 }
    });

    expect(result.current).toBe(1);
    rerender({ value: 2 });
    expect(result.current).toBe(1);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe(2);
  });
});
