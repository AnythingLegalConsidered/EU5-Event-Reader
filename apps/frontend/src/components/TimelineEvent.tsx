import type React from 'react';
import { TimelineEvent as TimelineEventType } from '@shared';

type TimelineEventProps = {
  timelineEvent: TimelineEventType;
  position: number;
  orientation: 'horizontal' | 'vertical';
  onClick: () => void;
  isSelected: boolean;
};

const truncate = (value: string | undefined, max = 30) => {
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};

export const TimelineEvent = ({ timelineEvent, position, orientation, onClick, isSelected }: TimelineEventProps) => {
  const style: React.CSSProperties =
    orientation === 'horizontal'
      ? { left: `${position}%`, top: '50%', transform: 'translate(-50%, -50%)' }
      : { top: `${position}%`, left: '50%', transform: 'translate(-50%, -50%)' };

  const { temporalData, event } = timelineEvent;
  const badges: string[] = [];
  if (temporalData?.year) badges.push(`${temporalData.year}`);
  if (temporalData?.date) badges.push(temporalData.date);
  if (event.major) badges.push('Major');
  if (event.is_triggered_only) badges.push('Triggered only');

  return (
    <div
      className={`timeline-event ${isSelected ? 'timeline-event--selected' : ''}`}
      style={style}
      onClick={onClick}
      role="button"
      tabIndex={0}
      data-testid={`timeline-event-${timelineEvent.eventId}`}
    >
      <div className="timeline-event__id">{timelineEvent.eventId}</div>
      <div className="timeline-event__title">{truncate(event.localizedTitle ?? event.title ?? '')}</div>
      <div className="timeline-event__badges">
        {badges.map(badge => (
          <span key={badge} className="timeline-event__badge">{badge}</span>
        ))}
      </div>
    </div>
  );
};

export default TimelineEvent;
