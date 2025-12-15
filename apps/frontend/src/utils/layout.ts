import dagre from 'dagre';
import { Edge, Node } from 'reactflow';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;

const getGraph = (direction: 'TB' | 'LR' = 'TB') => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, ranksep: 80, nodesep: 40, edgesep: 20 });
  g.setDefaultEdgeLabel(() => ({}));
  return g;
};

export const applyDagreLayout = <T = any>(
  nodes: Array<Node<T>>,
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): Array<Node<T>> => {
  const g = getGraph(direction);
  nodes.forEach(node => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map(node => {
    const pos = g.node(node.id) as { x: number; y: number };
    return {
      ...node,
      position: { x: pos.x, y: pos.y }
    };
  });
};

export const applyForceLayout = <T = any>(nodes: Array<Node<T>>): Array<Node<T>> => {
  // Placeholder: React Flow's default layout/dragging will handle force-like arrangement.
  return nodes;
};
