import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AppProvider } from '../../contexts';
import { useCountries } from '../useCountries';

vi.mock('../../utils/api', () => ({
  fetchCountries: vi.fn().mockResolvedValue([
    { tag: 'FRA', name: 'France', eventCount: 2 },
    { tag: 'ENG', name: 'England', eventCount: 1 }
  ])
}));

const TestComponent = () => {
  const { countries, loading, error } = useCountries('vanilla', 'english');
  return (
    <div>
      <div data-testid="loading">{loading ? 'yes' : 'no'}</div>
      <div data-testid="error">{error ?? ''}</div>
      <div data-testid="count">{countries.length}</div>
    </div>
  );
};

describe('useCountries', () => {
  it('loads and caches countries', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('loading').textContent).toBe('yes');

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'));
    expect(screen.getByTestId('error').textContent).toBe('');
    expect(screen.getByTestId('count').textContent).toBe('2');
  });
});
