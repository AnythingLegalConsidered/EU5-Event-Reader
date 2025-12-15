import { LocalizedEvent } from '@eu5-reader/shared';
import { Edge, Node } from 'reactflow';

export type GraphNodeData = {
  event?: LocalizedEvent | null;
  label: string;
  namespace: string;
  badges?: {
    major?: boolean;
    triggeredOnly?: boolean;
    fireOnlyOnce?: boolean;
  };
};

export type GraphEdgeData = {
  type: 'flag' | 'temporal' | 'event_reference' | 'missing';
  label?: string;
  missing?: boolean;
};

export type GraphData = {
  nodes: Array<Node<GraphNodeData>>;
  edges: Array<Edge<GraphEdgeData>>;
};

export type Cluster = {
  id: string;
  nodes: string[];
};

export type GraphStats = {
  nodeCount: number;
  edgeCount: number;
  missingDependencies: number;
  byType: Record<string, number>;
};
