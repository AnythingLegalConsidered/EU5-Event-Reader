import { useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  MiniMap,
  Node,
  ReactFlowProvider
} from 'reactflow';
import { EventDependencyGraph, LocalizedEvent } from '@eu5-reader/shared';
import GraphNode from './GraphNode';
import GraphLegend from './GraphLegend';
import GraphControls from './GraphControls';
import { buildGraphData, detectClusters, getGraphStats } from '../utils/graph';
import { applyDagreLayout, applyForceLayout } from '../utils/layout';
import { GraphEdgeData, GraphNodeData } from '../types/graph';

const nodeTypes = { custom: GraphNode };

type DependencyGraphProps = {
  dependencies: EventDependencyGraph[];
  events: LocalizedEvent[];
  onEventClick: (event: LocalizedEvent | null, nodeId: string) => void;
};

export const DependencyGraph = ({ dependencies, events, onEventClick }: DependencyGraphProps) => {
  const [layout, setLayout] = useState<'dagre' | 'force'>('dagre');
  const [showLegend, setShowLegend] = useState(true);
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);
  const [filters, setFilters] = useState<Record<string, boolean>>({
    event_reference: true,
    temporal: true,
    flag: true
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isTestEnv = typeof navigator !== 'undefined' && navigator.userAgent?.includes('jsdom');

  const { nodes, edges } = useMemo(() => buildGraphData(dependencies, events), [dependencies, events]);

  const laidOutNodes: Array<Node<GraphNodeData>> = useMemo(() => {
    if (layout === 'dagre') return applyDagreLayout(nodes, edges, 'TB');
    return applyForceLayout(nodes);
  }, [layout, nodes, edges]);

  const filteredEdges: Array<Edge<GraphEdgeData>> = useMemo(
    () => edges.filter(edge => filters[edge.data?.type ?? 'event_reference']),
    [edges, filters]
  );

  const displayEdges: Array<Edge<GraphEdgeData>> = useMemo(
    () =>
      filteredEdges.map(edge => ({
        ...edge,
        label: showEdgeLabels ? edge.label : undefined
      })),
    [filteredEdges, showEdgeLabels]
  );

  const stats = useMemo(() => getGraphStats(laidOutNodes, filteredEdges), [laidOutNodes, filteredEdges]);
  useMemo(() => detectClusters(dependencies), [dependencies]);

  const handleNodeClick = (_: unknown, node: Node<GraphNodeData>) => {
    setSelectedId(node.id);
    onEventClick(node.data.event ?? null, node.id);
  };

  return (
    <div className="graph-wrapper">
      <GraphControls
        layout={layout}
        onLayoutChange={setLayout}
        showLegend={showLegend}
        onToggleLegend={() => setShowLegend(v => !v)}
        showEdgeLabels={showEdgeLabels}
        onToggleEdgeLabels={() => setShowEdgeLabels(v => !v)}
        filters={filters}
        onFilterChange={(type, value) => setFilters(prev => ({ ...prev, [type]: value }))}
      />

      <div className="graph-container">
        <ReactFlowProvider>
          <ReactFlow
            fitView
            nodes={laidOutNodes.map(node => ({ ...node, selected: node.id === selectedId }))}
            edges={displayEdges}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            nodesDraggable={!isTestEnv}
            nodesConnectable={false}
            panOnDrag={!isTestEnv}
            zoomOnScroll={!isTestEnv}
            zoomOnPinch={!isTestEnv}
            zoomOnDoubleClick={!isTestEnv}
          >
            <Controls />
            <MiniMap pannable zoomable />
            <Background variant={BackgroundVariant.Dots} gap={14} size={1} />
          </ReactFlow>
        </ReactFlowProvider>
        {showLegend && <GraphLegend stats={stats} onClose={() => setShowLegend(false)} />}
      </div>
    </div>
  );
};

export default DependencyGraph;
