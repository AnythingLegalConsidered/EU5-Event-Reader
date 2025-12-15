type GraphControlsProps = {
  layout: 'dagre' | 'force';
  onLayoutChange: (layout: 'dagre' | 'force') => void;
  showLegend: boolean;
  onToggleLegend: () => void;
  showEdgeLabels: boolean;
  onToggleEdgeLabels: () => void;
  filters: Record<string, boolean>;
  onFilterChange: (type: string, value: boolean) => void;
};

const GraphControls = ({
  layout,
  onLayoutChange,
  showLegend,
  onToggleLegend,
  showEdgeLabels,
  onToggleEdgeLabels,
  filters,
  onFilterChange
}: GraphControlsProps) => {
  return (
    <div className="graph-controls">
      <div className="graph-controls__group">
        <label htmlFor="layout-select">Layout</label>
        <select
          id="layout-select"
          value={layout}
          onChange={e => onLayoutChange(e.target.value as 'dagre' | 'force')}
        >
          <option value="dagre">Dagre</option>
          <option value="force">Force</option>
        </select>
      </div>

      <div className="graph-controls__group">
        <label>
          <input type="checkbox" checked={showLegend} onChange={onToggleLegend} /> Légende
        </label>
        <label>
          <input type="checkbox" checked={showEdgeLabels} onChange={onToggleEdgeLabels} /> Labels arêtes
        </label>
      </div>

      <div className="graph-controls__group graph-controls__filters">
        {['event_reference', 'temporal', 'flag'].map(type => (
          <label key={type}>
            <input
              type="checkbox"
              checked={filters[type] ?? true}
              onChange={e => onFilterChange(type, e.target.checked)}
            />
            {type}
          </label>
        ))}
      </div>
    </div>
  );
};

export default GraphControls;
