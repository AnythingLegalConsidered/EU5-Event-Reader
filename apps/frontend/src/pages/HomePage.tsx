import CountrySelector from '../components/CountrySelector';
import { SourceSelector } from '../components/SourceSelector';

const HomePage = () => {
  return (
    <div className="page">
      <div className="grid two-columns">
        <SourceSelector />
        <CountrySelector />
      </div>
    </div>
  );
};

export default HomePage;
