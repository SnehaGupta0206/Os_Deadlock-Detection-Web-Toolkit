import React, { useMemo } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls, 
  MarkerType,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Process } from '../lib/os-logic';

interface ResourceGraphProps {
  processes: Process[];
  resourceNames: string[];
  totalResources: number[]; // Initial total resources
}

const ResourceGraph: React.FC<ResourceGraphProps> = ({ processes, resourceNames, totalResources }) => {
  const { nodes, edges } = useMemo(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const width = 800;
    const height = 500;

    // 1. Create Resource Nodes (Right Side)
    resourceNames.forEach((name, idx) => {
      newNodes.push({
        id: `R-${idx}`,
        type: 'default', // Default input/output node
        data: { label: `${name} (Total: ${totalResources[idx]})` },
        position: { x: width - 200, y: (height / (resourceNames.length + 1)) * (idx + 1) },
        style: { 
          background: '#e0f2fe', 
          border: '1px solid #0284c7', 
          borderRadius: '4px',
          fontWeight: 'bold',
          width: 150
        },
        sourcePosition: Position.Left,
        targetPosition: Position.Left,
      });
    });

    // 2. Create Process Nodes (Left Side)
    processes.forEach((p, idx) => {
      newNodes.push({
        id: `P-${p.id}`,
        type: 'default', // Default input/output node
        data: { label: `P${p.id}` },
        position: { x: 100, y: (height / (processes.length + 1)) * (idx + 1) },
        style: { 
          background: '#f0fdf4', 
          border: '1px solid #16a34a', 
          borderRadius: '50%', 
          width: 50, 
          height: 50,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 'bold'
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Right,
      });

      // 3. Create Edges
      
      // Allocation Edges: Resource -> Process (Holding)
      p.allocation.forEach((count, rIdx) => {
        if (count > 0) {
          newEdges.push({
            id: `edge-alloc-P${p.id}-R${rIdx}`,
            source: `R-${rIdx}`,
            target: `P-${p.id}`,
            label: `${count}`,
            animated: false,
            style: { stroke: '#0ea5e9', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#0ea5e9' },
          });
        }
      });

      // Need Edges: Process -> Resource (Waiting/Requesting)
      p.need.forEach((count, rIdx) => {
        if (count > 0) {
          newEdges.push({
            id: `edge-need-P${p.id}-R${rIdx}`,
            source: `P-${p.id}`,
            target: `R-${rIdx}`,
            label: `${count}`,
            animated: true, // Animated because it's a request/wait
            style: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5,5' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
          });
        }
      });
    });

    return { nodes: newNodes, edges: newEdges };
  }, [processes, resourceNames, totalResources]);

  return (
    <div className="h-[500px] w-full border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        attributionPosition="bottom-right"
      >
        <Background gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default ResourceGraph;
