import { LocalizedEvent } from '@shared';
import { formatEventId, formatParadoxValue, formatTrigger } from '../utils/formatters';

type EventDetailProps = {
  event: LocalizedEvent;
  onClose: () => void;
};

const EventDetail = ({ event, onClose }: EventDetailProps) => {
  const fullId = formatEventId(event.namespace, event.id);

  return (
    <div className="event-detail">
      <div className="event-detail-header">
        <div>
          <div className="event-id">{fullId}</div>
          <h2 className="event-title">{event.localizedTitle ?? event.title ?? 'Untitled event'}</h2>
          <div className="event-badges">
            {event.major && <span className="event-badge event-badge--major">Major</span>}
            {event.is_triggered_only && <span className="event-badge event-badge--triggered">Triggered only</span>}
            {event.fire_only_once && <span className="event-badge">Fire once</span>}
            {event.hidden && <span className="event-badge">Hidden</span>}
          </div>
        </div>
        {event.picture && (
          <img className="event-picture" src={event.picture} alt={event.localizedTitle ?? event.title ?? fullId} />
        )}
        <button className="btn" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <details className="event-section" open>
        <summary className="event-section-title">Description</summary>
        <div className="event-section-content">{event.localizedDesc ?? event.desc ?? 'No description'}</div>
      </details>

      {event.trigger && (
        <details className="event-section" open>
          <summary className="event-section-title">Trigger</summary>
          <div className="event-section-content">{formatTrigger(event.trigger)}</div>
        </details>
      )}

      {event.immediate && (
        <details className="event-section" open>
          <summary className="event-section-title">Immediate Effects</summary>
          <div className="event-section-content">{formatParadoxValue(event.immediate)}</div>
        </details>
      )}

      {event.localizedOptions && event.localizedOptions.length > 0 && (
        <details className="event-section" open>
          <summary className="event-section-title">Options</summary>
          <div className="event-section-content">
            {event.localizedOptions.map(opt => (
              <div key={opt.id ?? opt.originalOption.id} className="event-option">
                <div className="event-title">{opt.localizedName ?? opt.originalOption.name ?? opt.id}</div>
                {opt.originalOption.trigger && (
                  <div className="event-block">{formatTrigger(opt.originalOption.trigger)}</div>
                )}
                {opt.originalOption.effects && (
                  <div className="event-block">{formatParadoxValue(opt.originalOption.effects)}</div>
                )}
                {opt.originalOption.ai_chance !== undefined && (
                  <div className="event-meta">AI Chance: {opt.originalOption.ai_chance}</div>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      <details className="event-section" open>
        <summary className="event-section-title">Metadata</summary>
        <div className="event-section-content">
          <div>Mean time to happen: {event.mean_time_to_happen ? formatParadoxValue(event.mean_time_to_happen) : 'N/A'}</div>
          <div>Triggered only: {event.is_triggered_only ? 'Yes' : 'No'}</div>
          <div>Fire only once: {event.fire_only_once ? 'Yes' : 'No'}</div>
          <div>Hidden: {event.hidden ? 'Yes' : 'No'}</div>
        </div>
      </details>
    </div>
  );
};

export default EventDetail;
