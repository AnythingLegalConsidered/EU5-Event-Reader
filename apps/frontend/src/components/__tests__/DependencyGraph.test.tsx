import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DependencyGraph from '../DependencyGraph';
import { EventDependencyGraph, LocalizedEvent } from '@eu5-reader/shared';

describe('DependencyGraph component', () => {
  const events: LocalizedEvent[] = [
    { namespace: 'ns', id: 1, localizedTitle: 'First' } as any,
    { namespace: 'ns', id: 2, localizedTitle: 'Second' } as any
  ];

  const dependencies: EventDependencyGraph[] = [
    {
      eventId: 'ns.1',
      namespace: 'ns',
      dependencies: [{ type: 'event_reference', key: 'ns.2', sourceEventId: 'ns.1', targetEventId: 'ns.2' }]
    },
    {
      eventId: 'ns.2',
      namespace: 'ns',
      dependencies: []
    }
  ];

  it('renders nodes and calls onEventClick on node click', async () => {
    const onEventClick = vi.fn();
    const user = userEvent.setup();
    render(<DependencyGraph dependencies={dependencies} events={events} onEventClick={onEventClick} />);

    const node = await screen.findByTestId('graph-node-ns.1');
    expect(node).toBeTruthy();
    await user.click(node);
    expect(onEventClick).toHaveBeenCalledWith(expect.objectContaining({ localizedTitle: 'First' }), 'ns.1');
  });

  it('shows legend stats', () => {
    render(<DependencyGraph dependencies={dependencies} events={events} onEventClick={vi.fn()} />);
    expect(screen.getByText(/nœuds/i)).toBeTruthy();
    const edgeTexts = screen.getAllByText(/arêtes/i);
    expect(edgeTexts.length).toBeGreaterThan(0);
  });
});
