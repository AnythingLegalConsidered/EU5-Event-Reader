import { useMemo, useState } from 'react';
import { LocalizedEvent, TimelineData, TimelineEvent as TimelineEventType } from '@shared';
import TimelineEvent from './TimelineEvent';
import TimelineControls from './TimelineControls';

type TimelineProps = {
  timelineData: TimelineData;
  orientation?: 'horizontal' | 'vertical';
  onEventClick: (event: LocalizedEvent) => void;
};

type PositionedEvent = {
  position: number;
  eventId: string;
};

const computeValue = (event: TimelineData['events'][number]): number => {
  const { temporalData } = event;
  if (!temporalData) return Number.POSITIVE_INFINITY;
  const { year, date } = temporalData;
  if (date) {
    const [y, m, d] = date.split('.').map(part => Number(part));
    return y + ((m - 1) / 12 || 0) + ((d - 1) / 365 || 0);
  }
  return year ?? Number.POSITIVE_INFINITY;
};

const toPositionMap = (events: TimelineData['events']) => {
  const values = events.map(evt => computeValue(evt)).filter(v => Number.isFinite(v));
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const span = max - min || 1;
  const map = new Map<string, PositionedEvent>();

  events.forEach(evt => {
    const value = computeValue(evt);
    const normalized = Number.isFinite(value) ? ((value - min) / span) * 100 : 0;
    map.set(evt.eventId.toLowerCase(), { position: normalized, eventId: evt.eventId });
  });

  return { map, min, max };
};

const buildConnectors = (
  events: TimelineData['events'],
  positions: Map<string, PositionedEvent>,
  orientation: 'horizontal' | 'vertical'
): Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> => {
  const connectors: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = [];
  events.forEach(evt => {
    const posA = positions.get(evt.eventId.toLowerCase());
    if (!posA) return;
    evt.dependencies.outgoing.forEach(dep => {
      if (dep.type !== 'event_reference' || !dep.targetEventId) return;
      const posB = positions.get(dep.targetEventId.toLowerCase());
      if (!posB) return;
      if (orientation === 'horizontal') {
        connectors.push({ x1: posA.position, y1: 50, x2: posB.position, y2: 50, key: `${evt.eventId}-${dep.targetEventId}-${dep.path ?? ''}` });
      } else {
        connectors.push({ x1: 50, y1: posA.position, x2: 50, y2: posB.position, key: `${evt.eventId}-${dep.targetEventId}-${dep.path ?? ''}` });
      }
    });
  });
  return connectors;
};

export const Timeline = ({ timelineData, orientation = 'horizontal', onEventClick }: TimelineProps) => {
  const [zoom, setZoom] = useState(1);
  const [currentOrientation, setCurrentOrientation] = useState<'horizontal' | 'vertical'>(orientation);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { positions, connectors } = useMemo(() => {
    const { map } = toPositionMap(timelineData.events);
    return {
      positions: map,
      connectors: buildConnectors(timelineData.events, map, currentOrientation)
    };
  }, [currentOrientation, timelineData.events]);

  const positionedEvents = useMemo(() => {
    return timelineData.events.map(evt => ({
      evt,
      position: positions.get(evt.eventId.toLowerCase())?.position ?? 0
    }));
  }, [positions, timelineData.events]);

  const handleOrientationToggle = (): void => {
    setCurrentOrientation(prev => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
  };

  const handleZoomIn = (): void => setZoom(z => Math.min(2, +(z + 0.2).toFixed(1)));
  const handleZoomOut = (): void => setZoom(z => Math.max(0.6, +(z - 0.2).toFixed(1)));
  const handleResetZoom = (): void => setZoom(1);

  const handleEventClick = (event: TimelineEventType): void => {
    setSelectedId(event.eventId);
    onEventClick(event.event);
  };

  if (!timelineData.events.length) {
    return <div className="card">Aucun événement avec données temporelles</div>;
  }

  return (
    <div className="card timeline-wrapper">
      <TimelineControls
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        orientation={currentOrientation}
        onOrientationToggle={handleOrientationToggle}
        dateRange={timelineData.dateRange}
      />
      <div className={`timeline-container timeline-${currentOrientation}`}>
        <div className="timeline-axis">
          <span className="timeline-date-label">{timelineData.dateRange.min ?? '–'}</span>
          <span className="timeline-date-label">{timelineData.dateRange.max ?? '–'}</span>
        </div>
        <div className="timeline-content" style={{ transform: `scale(${zoom})` }}>
          {connectors.length > 0 && (
            <svg className="timeline-connections" viewBox="0 0 100 100" preserveAspectRatio="none">
              {connectors.map(line => (
                <line
                  key={line.key}
                  x1={`${line.x1}`}
                  y1={`${line.y1}`}
                  x2={`${line.x2}`}
                  y2={`${line.y2}`}
                  stroke="#94a3b8"
                  strokeWidth={0.5}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          )}
          {positionedEvents.map(({ evt, position }) => (
            <TimelineEvent
              key={evt.eventId}
              timelineEvent={evt}
              position={position}
              orientation={currentOrientation}
              isSelected={selectedId === evt.eventId}
              onClick={() => handleEventClick(evt)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
