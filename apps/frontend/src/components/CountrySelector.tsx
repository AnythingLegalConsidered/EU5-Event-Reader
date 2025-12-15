import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Country } from '@shared';
import { useCountries } from '../hooks';
import { useAppContext } from '../contexts';
import SearchBar from './SearchBar';
import CountryCard from './CountryCard';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const CountrySelector = () => {
  const navigate = useNavigate();
  const { source, language } = useAppContext();
  const { countries, loading, error, refetch } = useCountries(source, language);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return countries.filter((country: Country) =>
      country.tag.toLowerCase().includes(q) || country.name.toLowerCase().includes(q)
    );
  }, [countries, query]);

  const handleSelect = (tag: string) => {
    navigate(`/country/${tag}`);
  };

  return (
    <div className="card country-selector">
      <div className="country-selector__header">
        <div>
          <h3>Choose a country</h3>
          <p className="muted">Browse countries and see their events.</p>
        </div>
        <SearchBar value={query} onChange={setQuery} placeholder="Search by tag or name" />
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!loading && !error && (
        <div className="country-grid">
          {filtered.length === 0 ? (
            <div className="empty-state">No countries found.</div>
          ) : (
            filtered.map(country => (
              <CountryCard key={country.tag} country={country} onClick={() => handleSelect(country.tag)} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
