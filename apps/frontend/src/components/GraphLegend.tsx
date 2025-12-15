import { GraphStats } from '../types/graph';

const EDGE_COLORS = {
  flag: '#2563eb',
  temporal: '#16a34a',
  event_reference: '#ef4444',
  missing: '#94a3b8'
};

type GraphLegendProps = {
  stats: GraphStats;
  onClose?: () => void;
};

const GraphLegend = ({ stats, onClose }: GraphLegendProps) => {
  return (
    <div className="graph-legend">
      <div className="graph-legend__header">
        <strong>Légende</strong>
        {onClose && (
          <button className="btn-ghost" type="button" onClick={onClose} aria-label="Masquer la légende">
            Fermer
          </button>
        )}
      </div>
      <div className="graph-legend__items">
        <div className="graph-legend__item">
          <span className="legend-dot" style={{ background: EDGE_COLORS.flag }} /> Flag
        </div>
        <div className="graph-legend__item">
          <span className="legend-dot" style={{ background: EDGE_COLORS.temporal }} /> Temporal
        </div>
        <div className="graph-legend__item">
          <span className="legend-dot" style={{ background: EDGE_COLORS.event_reference }} /> Event Reference
        </div>
        <div className="graph-legend__item">
          <span className="legend-dot" style={{ background: EDGE_COLORS.missing, borderStyle: 'dashed', borderColor: '#94a3b8' }} />
          Missing
        </div>
      </div>
      <div className="graph-legend__stats">
        <div>{stats.nodeCount} nœuds</div>
        <div>{stats.edgeCount} arêtes</div>
        <div>{stats.missingDependencies} manquantes</div>
      </div>
    </div>
  );
};

export default GraphLegend;
