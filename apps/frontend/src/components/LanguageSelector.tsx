import { SupportedLanguage } from '@shared';
import { useAppContext } from '../contexts';

const languageLabels: Record<SupportedLanguage, string> = {
  english: 'English',
  french: 'Français',
  german: 'Deutsch',
  spanish: 'Español',
  russian: 'Русский'
};

export const LanguageSelector = () => {
  const { language, setLanguage } = useAppContext();

  return (
    <label className="language-selector">
      <span>Language</span>
      <select value={language} onChange={e => setLanguage(e.target.value as SupportedLanguage)}>
        {(Object.keys(languageLabels) as SupportedLanguage[]).map(code => (
          <option key={code} value={code}>
            {languageLabels[code]}
          </option>
        ))}
      </select>
    </label>
  );
};
