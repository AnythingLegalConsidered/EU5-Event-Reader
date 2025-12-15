import { useMemo, useState } from 'react';
import { LocalizedEvent } from '@shared';
import SearchBar from './SearchBar';
import EventCard from './EventCard';
import EventFilters from './EventFilters';
import VirtualEventList from './VirtualEventList';
import SkeletonCard from './SkeletonCard';
import ProgressBar from './ProgressBar';
import { EventFilterState } from '../types/api';
import { useDebounce } from '../hooks/useDebounce';

type EventListProps = {
  events: LocalizedEvent[];
  onEventClick: (event: LocalizedEvent) => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  virtualized?: boolean;
  total?: number;
};

const EventList = ({ events, onEventClick, loading, hasMore, onLoadMore, virtualized, total }: EventListProps) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<EventFilterState>({});
  const debouncedQuery = useDebounce(query, 300);

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    return events
      .filter(evt => {
        const matchesText =
          evt.id?.toString().toLowerCase().includes(q) ||
          (evt.localizedTitle ?? evt.title ?? '').toLowerCase().includes(q) ||
          (evt.localizedDesc ?? evt.desc ?? '').toLowerCase().includes(q);

  if (!matchesText) return false;

        if (filters.triggeredOnly && !evt.is_triggered_only) return false;
        if (filters.fireOnce && !evt.fire_only_once) return false;
        if (filters.major && !evt.major) return false;
        if (filters.hidden && !evt.hidden) return false;
        return true;
      });
  }, [debouncedQuery, events, filters]);

  return (
    <div className="event-list">
      <SearchBar value={query} onChange={setQuery} placeholder="Search by id, title, description" />
      <EventFilters filters={filters} onChange={setFilters} />

      {loading && events.length === 0 ? (
        <SkeletonCard count={6} />
      ) : (
        <div className="country-grid">
          {events.length === 0 ? (
            <div className="empty-state">Aucun événement disponible pour ce pays.</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              Aucun événement ne correspond à la recherche ou aux filtres.
              <button className="btn btn-ghost" type="button" onClick={() => setFilters({})}>
                Réinitialiser filtres
              </button>
            </div>
          ) : virtualized ? (
            <VirtualEventList
              events={filtered}
              onEventClick={onEventClick}
              hasMore={hasMore}
              loading={loading}
              onLoadMore={onLoadMore}
            />
          ) : (
            filtered.map(evt => (
              <EventCard key={`${evt.namespace}.${evt.id}`} event={evt} onClick={() => onEventClick(evt)} />
            ))
          )}
        </div>
      )}

      {hasMore && total ? (
        <ProgressBar current={events.length} total={total} label={`Chargement ${events.length}/${total} événements`} />
      ) : null}
    </div>
  );
};

export default EventList;
