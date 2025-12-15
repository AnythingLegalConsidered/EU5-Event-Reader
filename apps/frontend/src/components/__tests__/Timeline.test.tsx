import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timeline } from '../Timeline';
import { TimelineData } from '@shared';

const makeTimeline = (): TimelineData => ({
  events: [
    {
      eventId: 'ns.1',
      namespace: 'ns',
      event: { namespace: 'ns', id: 1, localizedTitle: 'One' } as any,
      temporalData: { year: 1500, date: '1500.01.01' },
      dependencies: { incoming: [], outgoing: [] }
    },
    {
      eventId: 'ns.2',
      namespace: 'ns',
      event: { namespace: 'ns', id: 2, localizedTitle: 'Two' } as any,
      temporalData: { year: 1510 },
      dependencies: { incoming: [], outgoing: [{ type: 'event_reference', key: 'ns.1', targetEventId: 'ns.1', sourceEventId: 'ns.2' }] as any }
    }
  ],
  dateRange: { min: 1500, max: 1510 }
});

describe('Timeline component', () => {
  it('renders empty state when no events', () => {
    const timeline: TimelineData = { events: [], dateRange: {} } as any;
    render(<Timeline timelineData={timeline} onEventClick={() => {}} />);
    expect(screen.getByText(/aucun événement/i)).toBeTruthy();
  });

  it('renders events and handles click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Timeline timelineData={makeTimeline()} onEventClick={onClick} />);

    const eventNode = screen.getByTestId('timeline-event-ns.1');
    expect(eventNode).toBeTruthy();
    await user.click(eventNode);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('supports zoom controls', async () => {
    const user = userEvent.setup();
    render(<Timeline timelineData={makeTimeline()} onEventClick={() => {}} />);

    const zoomValue = () => screen.getByText(/x/).textContent;
    const zoomIn = screen.getByRole('button', { name: /zoom in/i });
    const zoomOut = screen.getByRole('button', { name: /zoom out/i });

    const initial = zoomValue();
    await user.click(zoomIn);
    expect(zoomValue()).not.toBe(initial);
    await user.click(zoomOut);
    expect(zoomValue()).toBe(initial);
  });

  it('toggles orientation', async () => {
    const user = userEvent.setup();
    render(<Timeline timelineData={makeTimeline()} onEventClick={() => {}} orientation="horizontal" />);

    const toggle = screen.getByRole('button', { name: /toggle orientation/i });
    expect(toggle.textContent).toMatch(/Horizontal/);
    await user.click(toggle);
    expect(toggle.textContent).toMatch(/Vertical/);
  });
});
