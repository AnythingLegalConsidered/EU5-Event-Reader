type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const SearchBar = ({ value, onChange, placeholder }: SearchBarProps) => (
  <div className="search-bar">
    <span className="search-icon" aria-hidden="true">🔍</span>
    <input
      type="search"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
    {value && (
      <button className="clear-btn" type="button" onClick={() => onChange('')} aria-label="Clear search">
        ×
      </button>
    )}
  </div>
);

export default SearchBar;
