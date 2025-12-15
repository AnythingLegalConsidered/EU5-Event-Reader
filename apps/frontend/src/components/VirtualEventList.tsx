import { useEffect, useRef } from 'react';
import { FixedSizeList, ListOnItemsRenderedProps } from 'react-window';
import { LocalizedEvent } from '@shared';
import EventCard from './EventCard';
import SkeletonCard from './SkeletonCard';

export type VirtualEventListProps = {
  events: LocalizedEvent[];
  onEventClick: (event: LocalizedEvent) => void;
  height?: number;
  itemHeight?: number;
  hasMore?: boolean;
  loading?: boolean;
  onLoadMore?: () => void;
};

const VirtualEventList = ({
  events,
  onEventClick,
  height = 600,
  itemHeight = 120,
  hasMore,
  loading,
  onLoadMore
}: VirtualEventListProps) => {
  const itemCount = hasMore ? events.length + 1 : events.length;
  const loadInFlight = useRef(false);

  useEffect(() => {
    if (!loading) loadInFlight.current = false;
  }, [loading]);

  const handleItemsRendered = (props: ListOnItemsRenderedProps) => {
    const nearEnd = props.visibleStopIndex >= events.length - 2;
    if (nearEnd && hasMore && !loading && !loadInFlight.current) {
      loadInFlight.current = true;
      onLoadMore?.();
    }
  };

  return (
    <div className="virtual-list-container">
      <FixedSizeList
        height={height}
        itemSize={itemHeight}
        itemCount={itemCount}
        width="100%"
        onItemsRendered={handleItemsRendered}
      >
        {({ index, style }) => {
          if (index >= events.length) {
            return (
              <div style={style}>
                <SkeletonCard count={1} />
              </div>
            );
          }
          const evt = events[index];
          return (
            <div style={style}>
              <EventCard event={evt} onClick={() => onEventClick(evt)} />
            </div>
          );
        }}
      </FixedSizeList>
    </div>
  );
};

export default VirtualEventList;
