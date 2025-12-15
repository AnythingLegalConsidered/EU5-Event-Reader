import { Country } from '@shared';

type CountryCardProps = {
  country: Country;
  onClick: () => void;
};

const CountryCard = ({ country, onClick }: CountryCardProps) => (
  <button className="country-card" type="button" onClick={onClick}>
    <div className="country-tag">{country.tag}</div>
    <div className="country-name">{country.name}</div>
    <div className="country-count">{country.eventCount} events</div>
  </button>
);

export default CountryCard;
