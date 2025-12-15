import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LocalizedEvent } from '@shared';
import { useAppContext } from '../contexts';
import { useDependencies, usePaginatedEvents } from '../hooks';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EventList from '../components/EventList';
import EventDetail from '../components/EventDetail';
import Timeline from '../components/Timeline';
import DependencyGraph from '../components/DependencyGraph';
import { buildTimelineData } from '../utils/timeline';

const CountryPage = () => {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const { source, language } = useAppContext();
  const [selectedEvent, setSelectedEvent] = useState<LocalizedEvent | null>(null);
  const countryTag = tag?.trim();

  if (!countryTag) {
    return (
      <div className="page">
        <div className="card">
          <h2>Invalid country</h2>
          <p className="muted">The requested country tag is missing. Please select a country from the list.</p>
          <button className="btn" type="button" onClick={() => navigate('/')}>Go back</button>
        </div>
      </div>
    );
  }

  const {
    events,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    pagination,
    loadAll
  } = usePaginatedEvents(countryTag, source, language, 50);
  const {
    dependencies,
    loading: depsLoading,
    error: depsError,
    refetch: refetchDeps
  } = useDependencies(countryTag, source, language);
  const [view, setView] = useState<'list' | 'timeline' | 'graph'>('list');
  const [ensuringAll, setEnsuringAll] = useState(false);

  const timelineData = useMemo(() => buildTimelineData(events, dependencies), [dependencies, events]);

  useEffect(() => {
    if ((view === 'timeline' || view === 'graph') && hasMore) {
      setEnsuringAll(true);
      void loadAll().finally(() => setEnsuringAll(false));
    }
  }, [hasMore, loadAll, view]);

  return (
    <div className="page">
      <div className="app-header">
        <div>
          <button className="btn" type="button" onClick={() => navigate('/')}>
            Back
          </button>
          <h2>Events for {countryTag}</h2>
          <p className="muted">Source: {source} • Language: {language} • Count: {pagination?.total ?? events.length}</p>
        </div>
      </div>

      {(loading || depsLoading || ensuringAll) && <LoadingSpinner />}
      {(error || depsError) && (
        <ErrorMessage
          message={error || depsError || 'Failed to load data'}
          onRetry={() => {
            refresh();
            refetchDeps();
          }}
        />
      )}

      {!loading && !depsLoading && !error && !depsError && (
        <>
          <div className="view-toggle">
            <button
              className={`btn ${view === 'list' ? '' : 'btn-ghost'}`}
              type="button"
              onClick={() => setView('list')}
            >
              Liste
            </button>
            <button
              className={`btn ${view === 'timeline' ? '' : 'btn-ghost'}`}
              type="button"
              onClick={() => setView('timeline')}
            >
              Timeline
            </button>
            <button
              className={`btn ${view === 'graph' ? '' : 'btn-ghost'}`}
              type="button"
              onClick={() => setView('graph')}
            >
              Graphe
            </button>
          </div>

          {view === 'list' && (
            <div className="grid two-columns">
              <div className="card">
                <EventList
                  events={events}
                  onEventClick={setSelectedEvent}
                  loading={loading}
                  hasMore={hasMore}
                  onLoadMore={loadMore}
                  virtualized={events.length > 50}
                  total={pagination?.total}
                />
              </div>
              {selectedEvent && (
                <div className="card">
                  <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
                </div>
              )}
            </div>
          )}

          {view === 'timeline' && (
            <div className="grid two-columns">
              <Timeline
                timelineData={timelineData}
                onEventClick={event => {
                  setSelectedEvent(event);
                  setView('timeline');
                }}
              />
              {selectedEvent && (
                <div className="card">
                  <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
                </div>
              )}
            </div>
          )}

          {view === 'graph' && (
            <div className="grid two-columns">
              <DependencyGraph
                dependencies={dependencies}
                events={events}
                onEventClick={(evt, nodeId) => {
                  setSelectedEvent(evt ?? null);
                  if (!evt) {
                    console.warn(`No metadata found for event ${nodeId}`);
                  }
                }}
              />
              {selectedEvent && (
                <div className="card">
                  <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CountryPage;
