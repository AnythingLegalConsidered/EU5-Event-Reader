import { Edge, MarkerType, Node } from 'reactflow';
import { EventDependencyGraph, LocalizedEvent } from '@eu5-reader/shared';
import { Cluster, GraphData, GraphEdgeData, GraphNodeData, GraphStats } from '../types/graph';

const EDGE_COLORS: Record<GraphEdgeData['type'], string> = {
  flag: '#2563eb',
  temporal: '#16a34a',
  event_reference: '#ef4444',
  missing: '#94a3b8'
};

const normalizeId = (id: string): string => id.toLowerCase();

const buildNode = (graph: EventDependencyGraph, event?: LocalizedEvent | null): Node<GraphNodeData> => {
  const label = event?.localizedTitle ?? graph.eventId;
  return {
    id: graph.eventId,
    type: 'custom',
    position: { x: 0, y: 0 },
    data: {
      event: event ?? null,
      label,
      namespace: graph.namespace ?? '',
      badges: {
        major: Boolean((event as any)?.isMajor),
        triggeredOnly: Boolean((event as any)?.triggeredOnly),
        fireOnlyOnce: Boolean((event as any)?.fireOnlyOnce)
      }
    }
  };
};

const buildEdge = (
  source: string,
  target: string,
  type: GraphEdgeData['type'],
  opts?: { missing?: boolean; label?: string; path?: string | null }
): Edge<GraphEdgeData> => {
  const missing = Boolean(opts?.missing);
  const color = EDGE_COLORS[missing ? 'missing' : type];
  return {
    id: `${source}-${target}-${opts?.path ?? type}`,
    source,
    target,
    type: 'default',
    label: opts?.label ?? type,
    animated: missing,
    data: { type, missing },
    style: {
      stroke: color,
      strokeDasharray: missing ? '6 4' : undefined
    },
    markerEnd: { type: MarkerType.ArrowClosed, color }
  };
};

export const buildGraphData = (
  dependencies: EventDependencyGraph[],
  events: LocalizedEvent[]
): GraphData => {
  const eventMap = new Map<string, LocalizedEvent>();
  events.forEach(evt => {
    const keys = new Set<string>();
    const namespace = evt.namespace ?? '';
    keys.add(normalizeId(`${namespace}.${evt.id}`));
    keys.add(normalizeId(String(evt.id)));
    keys.forEach(k => eventMap.set(k, evt));
  });

  const graphMap = new Map<string, EventDependencyGraph>();
  dependencies.forEach(graph => {
    graphMap.set(normalizeId(graph.eventId), graph);
  });

  const nodes: Array<Node<GraphNodeData>> = dependencies.map(graph => {
    const normalizedId = normalizeId(graph.eventId);
    const namespaceKey = graph.namespace ? normalizeId(`${graph.namespace}.${graph.eventId}`) : normalizedId;
    const evt = eventMap.get(normalizedId) ?? eventMap.get(namespaceKey) ?? null;
    return buildNode(graph, evt);
  });

  const edges: Array<Edge<GraphEdgeData>> = [];

  dependencies.forEach(graph => {
    graph.dependencies.forEach(dep => {
      if (dep.type !== 'event_reference' || !dep.targetEventId) return;
      const source = graph.eventId;
      const target = dep.targetEventId;
      const targetExists = graphMap.has(normalizeId(target));
      edges.push(
        buildEdge(source, target, 'event_reference', {
          missing: !targetExists,
          label: dep.type,
          path: dep.path ?? null
        })
      );
    });
  });

  return { nodes, edges };
};

export const detectClusters = (graphs: EventDependencyGraph[]): Cluster[] => {
  const adjacency = new Map<string, Set<string>>();
  graphs.forEach(graph => {
    if (!adjacency.has(graph.eventId)) adjacency.set(graph.eventId, new Set());
  });
  const addEdge = (a: string, b: string) => {
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    if (!adjacency.has(b)) adjacency.set(b, new Set());
    adjacency.get(a)!.add(b);
    adjacency.get(b)!.add(a);
  };

  graphs.forEach(graph => {
    const source = graph.eventId;
    graph.dependencies.forEach(dep => {
      if (dep.type === 'event_reference' && dep.targetEventId) {
        addEdge(source, dep.targetEventId);
      }
    });
  });

  const visited = new Set<string>();
  const clusters: Cluster[] = [];

  const dfs = (start: string, nodes: string[]) => {
    visited.add(start);
    nodes.push(start);
    adjacency.get(start)?.forEach(next => {
      if (!visited.has(next)) dfs(next, nodes);
    });
  };

  adjacency.forEach((_neighbors, node) => {
    if (visited.has(node)) return;
    const nodes: string[] = [];
    dfs(node, nodes);
    clusters.push({ id: nodes.sort().join('::'), nodes });
  });

  return clusters;
};

export const getGraphStats = (nodes: Array<Node<GraphNodeData>>, edges: Array<Edge<GraphEdgeData>>): GraphStats => {
  const byType: Record<string, number> = {};
  let missingDependencies = 0;

  edges.forEach(edge => {
    const type = edge.data?.type ?? 'unknown';
    byType[type] = (byType[type] ?? 0) + 1;
    if (edge.data?.missing) missingDependencies += 1;
  });

  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    missingDependencies,
    byType
  };
};
