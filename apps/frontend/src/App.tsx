import { Link, Outlet, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CountryPage from './pages/CountryPage';
import { LanguageSelector } from './components/LanguageSelector';
import { SourceSelector } from './components/SourceSelector';

const App = () => {
  return (
    <div className="layout">
      <header className="app-header">
        <div className="app-brand">
          <Link to="/">EU5 Event Reader</Link>
          <span className="app-tagline">Explore countries and events</span>
        </div>
        <div className="app-controls">
          <LanguageSelector />
          <SourceSelector compact />
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/country/:tag" element={<CountryPage />} />
      </Routes>

      <Outlet />
    </div>
  );
};

export default App;
