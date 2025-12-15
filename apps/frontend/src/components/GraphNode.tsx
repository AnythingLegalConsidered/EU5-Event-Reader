import { memo } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { GraphNodeData } from '../types/graph';

const badgeLabel = (label: string) => <span className="graph-node__badge">{label}</span>;

const GraphNode = memo((props: NodeProps<GraphNodeData>) => {
  const { id, data, selected } = props;
  const { event, label, badges } = data;

  return (
    <div
      data-testid={`graph-node-${id}`}
      className={`graph-node ${selected ? 'graph-node--selected' : ''}`}
      title={label}
    >
      <Handle type="target" position={Position.Top} />
      <div className="graph-node__title">{label || id}</div>
      <div className="graph-node__meta">{event?.namespace ?? data.namespace ?? 'N/A'}</div>
      <div className="graph-node__badges">
        {badges?.major && badgeLabel('Major')}
        {badges?.triggeredOnly && badgeLabel('Triggered only')}
        {badges?.fireOnlyOnce && badgeLabel('Once')}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

GraphNode.displayName = 'GraphNode';

export default GraphNode;
