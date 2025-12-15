import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { LocalizedEvent } from '@shared';
import VirtualEventList from '../VirtualEventList';

let latestOnItemsRendered: ((props: { visibleStartIndex: number; visibleStopIndex: number }) => void) | null = null;

vi.mock('react-window', () => {
  const FakeList = ({ onItemsRendered, itemCount, children }: any) => {
    latestOnItemsRendered = onItemsRendered;
    return (
      <div data-testid="list">
        {Array.from({ length: itemCount }).map((_, index) => (
          <div key={index}>{children({ index, style: {} })}</div>
        ))}
      </div>
    );
  };
  return { FixedSizeList: FakeList };
});

const events: LocalizedEvent[] = [
  { id: 1, namespace: 'ns', title: '', desc: '', localizedTitle: 'A', localizedDesc: '', trigger: { condition: 'always' }, options: [] },
  { id: 2, namespace: 'ns', title: '', desc: '', localizedTitle: 'B', localizedDesc: '', trigger: { condition: 'always' }, options: [] },
  { id: 3, namespace: 'ns', title: '', desc: '', localizedTitle: 'C', localizedDesc: '', trigger: { condition: 'always' }, options: [] }
];

const fireNearEnd = () => {
  latestOnItemsRendered?.({ visibleStartIndex: 0, visibleStopIndex: events.length });
};

describe('VirtualEventList', () => {
  beforeEach(() => {
    latestOnItemsRendered = null;
  });

  it('throttles loadMore calls while loading is false', () => {
    const onLoadMore = vi.fn();
    render(<VirtualEventList events={events} onEventClick={vi.fn()} hasMore loading={false} onLoadMore={onLoadMore} />);

    fireNearEnd();
    fireNearEnd();

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('allows another load after loading resets', () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <VirtualEventList events={events} onEventClick={vi.fn()} hasMore loading={false} onLoadMore={onLoadMore} />
    );

    fireNearEnd();
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rerender(
      <VirtualEventList events={events} onEventClick={vi.fn()} hasMore loading onLoadMore={onLoadMore} />
    );
    rerender(
      <VirtualEventList events={events} onEventClick={vi.fn()} hasMore loading={false} onLoadMore={onLoadMore} />
    );

    fireNearEnd();
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });
});
