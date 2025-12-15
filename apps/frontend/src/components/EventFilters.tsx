import { EventFilterState } from '../types/api';

type EventFiltersProps = {
  filters: EventFilterState;
  onChange: (filters: EventFilterState) => void;
};

const defaults: EventFilterState = {
  triggeredOnly: false,
  fireOnce: false,
  major: false,
  hidden: false
};

const EventFilters = ({ filters, onChange }: EventFiltersProps) => {
  const merged = { ...defaults, ...filters };

  const toggle = (key: keyof EventFilterState) => {
    onChange({ ...merged, [key]: !merged[key] });
  };

  const reset = () => onChange({});

  return (
    <div className="event-filters">
      <label className="filter-checkbox">
        <input type="checkbox" checked={!!merged.triggeredOnly} onChange={() => toggle('triggeredOnly')} />
        Triggered only
      </label>
      <label className="filter-checkbox">
        <input type="checkbox" checked={!!merged.fireOnce} onChange={() => toggle('fireOnce')} />
        Fire once
      </label>
      <label className="filter-checkbox">
        <input type="checkbox" checked={!!merged.major} onChange={() => toggle('major')} />
        Major
      </label>
      <label className="filter-checkbox">
        <input type="checkbox" checked={!!merged.hidden} onChange={() => toggle('hidden')} />
        Hidden
      </label>
      <button className="btn" type="button" onClick={reset}>
        Reset
      </button>
    </div>
  );
};

export default EventFilters;
