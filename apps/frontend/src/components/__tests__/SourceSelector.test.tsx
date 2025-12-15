import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useAppContext } from '../../contexts';
import { SourceSelector } from '../SourceSelector';

const ReadSource = () => {
  const { source } = useAppContext();
  return <div data-testid="current-source">{source}</div>;
};

describe('SourceSelector', () => {
  it('toggles source between vanilla and local', async () => {
    const user = userEvent.setup();
    render(
      <AppProvider>
        <SourceSelector />
        <ReadSource />
      </AppProvider>
    );

    expect(screen.getByTestId('current-source').textContent).toBe('vanilla');

    const localButton = screen.getByRole('button', { name: /local/i });
    await user.click(localButton);

    expect(screen.getByTestId('current-source').textContent).toBe('local');
  });
});
