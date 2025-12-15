import { describe, expect, it } from 'vitest';
import { buildGraphData, detectClusters, getGraphStats } from '../graph';
import { EventDependencyGraph, LocalizedEvent } from '@eu5-reader/shared';

describe('graph utilities', () => {
  const events: LocalizedEvent[] = [
    { namespace: 'ns', id: 1, localizedTitle: 'One' } as any,
    { namespace: 'ns', id: 2, localizedTitle: 'Two' } as any,
    { namespace: 'other', id: 3, localizedTitle: 'Three' } as any
  ];

  const graphs: EventDependencyGraph[] = [
    {
      eventId: 'ns.1',
      namespace: 'ns',
      dependencies: [
        { type: 'event_reference', key: 'ns.2', sourceEventId: 'ns.1', targetEventId: 'ns.2' },
        { type: 'event_reference', key: 'missing', sourceEventId: 'ns.1', targetEventId: 'ns.99' }
      ]
    },
    {
      eventId: 'ns.2',
      namespace: 'ns',
      dependencies: []
    },
    {
      eventId: 'other.3',
      namespace: 'other',
      dependencies: []
    }
  ];

  it('builds nodes and edges and marks missing targets', () => {
    const { nodes, edges } = buildGraphData(graphs, events);
    expect(nodes).toHaveLength(3);
    expect(edges).toHaveLength(2);
    const missingEdge = edges.find(e => e.target === 'ns.99');
    expect(missingEdge?.data?.missing).toBe(true);
    const validEdge = edges.find(e => e.target === 'ns.2');
    expect(validEdge?.data?.missing).toBeFalsy();
  });

  it('detects clusters including isolated nodes', () => {
    const clusters = detectClusters(graphs);
    const clusterIds = clusters.map(c => c.id);
    expect(clusters.some(c => c.nodes.includes('other.3'))).toBe(true);
    expect(clusterIds.length).toBeGreaterThanOrEqual(2);
  });

  it('computes graph stats by type', () => {
    const { nodes, edges } = buildGraphData(graphs, events);
    const stats = getGraphStats(nodes, edges as any);
    expect(stats.nodeCount).toBe(3);
    expect(stats.edgeCount).toBe(2);
    expect(stats.missingDependencies).toBe(1);
    expect(stats.byType.event_reference).toBe(2);
  });
});
