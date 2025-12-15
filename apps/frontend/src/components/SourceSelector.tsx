import { useAppContext } from '../contexts';

type SourceSelectorProps = {
  compact?: boolean;
};

export const SourceSelector = ({ compact }: SourceSelectorProps) => {
  const { source, setSource } = useAppContext();

  const options: Array<{ value: 'vanilla' | 'local'; label: string; helper: string }> = [
    { value: 'vanilla', label: 'Vanilla', helper: 'Base game events' },
    { value: 'local', label: 'Local', helper: 'Overrides from local files' }
  ];

  return (
    <div className={`card source-selector ${compact ? 'source-selector--compact' : ''}`}>
      {!compact && <h3>Select source</h3>}
      <div className="source-options">
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            className={`source-option ${source === option.value ? 'source-option--active' : ''}`}
            onClick={() => setSource(option.value)}
          >
            <span className="source-label">{option.label}</span>
            {!compact && <span className="source-helper">{option.helper}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};
