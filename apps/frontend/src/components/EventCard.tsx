import { LocalizedEvent } from '@shared';
import { formatEventId, truncateText } from '../utils/formatters';

type EventCardProps = {
  event: LocalizedEvent;
  onClick: () => void;
};

const EventCard = ({ event, onClick }: EventCardProps) => {
  const fullId = formatEventId(event.namespace, event.id);
  return (
    <button className="event-card" type="button" onClick={onClick}>
      <div className="event-id">{fullId}</div>
      <div className="event-title">{event.localizedTitle ?? event.title ?? 'Untitled event'}</div>
      <div className="event-desc">{truncateText(event.localizedDesc ?? event.desc ?? '', 100)}</div>
      <div className="event-badges">
        {event.major && <span className="event-badge event-badge--major">Major</span>}
        {event.is_triggered_only && <span className="event-badge event-badge--triggered">Triggered only</span>}
        {event.fire_only_once && <span className="event-badge">Fire once</span>}
        {event.hidden && <span className="event-badge">Hidden</span>}
      </div>
      <div className="event-meta">Options: {event.localizedOptions?.length ?? event.options?.length ?? 0}</div>
    </button>
  );
};

export default EventCard;
