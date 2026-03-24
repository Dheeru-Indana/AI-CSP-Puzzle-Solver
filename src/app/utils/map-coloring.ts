import { CSPVariable, CSPConstraint } from './csp-solver';

export interface MapNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface MapEdge {
  from: string;
  to: string;
}

export interface MapColoringProblem {
  name: string;
  nodes: MapNode[];
  edges: MapEdge[];
  colors: string[];
}

const COLORS_4 = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
const COLORS_3 = ['#ef4444', '#3b82f6', '#22c55e'];

export const PREDEFINED_MAPS: MapColoringProblem[] = [
  {
    name: 'Simple Graph',
    nodes: [
      { id: 'A', label: 'Region A', x: 200, y: 100 },
      { id: 'B', label: 'Region B', x: 350, y: 100 },
      { id: 'C', label: 'Region C', x: 200, y: 250 },
      { id: 'D', label: 'Region D', x: 350, y: 250 },
    ],
    edges: [
      { from: 'A', to: 'B' },
      { from: 'A', to: 'C' },
      { from: 'B', to: 'D' },
      { from: 'C', to: 'D' },
    ],
    colors: COLORS_3,
  },
  {
    name: 'Pentagon Graph',
    nodes: [
      { id: 'A', label: 'Region A', x: 275, y: 50 },
      { id: 'B', label: 'Region B', x: 450, y: 150 },
      { id: 'C', label: 'Region C', x: 400, y: 350 },
      { id: 'D', label: 'Region D', x: 150, y: 350 },
      { id: 'E', label: 'Region E', x: 100, y: 150 },
    ],
    edges: [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
      { from: 'C', to: 'D' },
      { from: 'D', to: 'E' },
      { from: 'E', to: 'A' },
    ],
    colors: COLORS_3,
  },
  {
    name: 'Complex Map',
    nodes: [
      { id: 'A', label: 'A', x: 150, y: 100 },
      { id: 'B', label: 'B', x: 300, y: 100 },
      { id: 'C', label: 'C', x: 450, y: 100 },
      { id: 'D', label: 'D', x: 150, y: 250 },
      { id: 'E', label: 'E', x: 300, y: 250 },
      { id: 'F', label: 'F', x: 450, y: 250 },
    ],
    edges: [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
      { from: 'A', to: 'D' },
      { from: 'B', to: 'E' },
      { from: 'C', to: 'F' },
      { from: 'D', to: 'E' },
      { from: 'E', to: 'F' },
      { from: 'A', to: 'E' },
      { from: 'C', to: 'E' },
    ],
    colors: COLORS_4,
  },
];

export function mapToCSP(map: MapColoringProblem): {
  variables: CSPVariable[];
  constraints: CSPConstraint[];
} {
  // Create variables (each node can be assigned one of the colors)
  const variables: CSPVariable[] = map.nodes.map(node => ({
    name: node.id,
    domain: [...Array(map.colors.length).keys()], // Use indices instead of colors
  }));

  // Create constraints (adjacent nodes must have different colors)
  const constraints: CSPConstraint[] = map.edges.map(edge => ({
    variables: [edge.from, edge.to],
    check: (assignment) => {
      const color1 = assignment.get(edge.from);
      const color2 = assignment.get(edge.to);
      
      if (color1 === undefined || color2 === undefined) {
        return true; // Can't check yet
      }
      
      return color1 !== color2;
    },
    description: `${edge.from} and ${edge.to} must have different colors`,
  }));

  return { variables, constraints };
}

export function getNodeColor(
  nodeId: string,
  assignment: Map<string, number>,
  colors: string[]
): string | null {
  const colorIndex = assignment.get(nodeId);
  return colorIndex !== undefined ? colors[colorIndex] : null;
}
