import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { ActivityNode } from "./ActivityNode";
import { Activity } from "@/types/activity";
import {
  calculateNetworkAnalysis,
  getTopologicalLevels,
} from "@/utils/networkCalculations";

interface NetworkDiagramProps {
  activities: Activity[];
}

const nodeTypes = {
  activity: ActivityNode,
};

export const NetworkDiagram = ({ activities }: NetworkDiagramProps) => {
  const calculatedActivities = useMemo(
    () => calculateNetworkAnalysis(activities),
    [activities]
  );

  const levels = useMemo(
    () => getTopologicalLevels(activities),
    [activities]
  );

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const levelGroups = new Map<number, string[]>();

    calculatedActivities.forEach((activity) => {
      const level = levels.get(activity.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(activity.id);
    });

    const nodes = calculatedActivities.map((activity) => {
      const level = levels.get(activity.id) || 0;
      const group = levelGroups.get(level) || [];
      const indexInGroup = group.indexOf(activity.id);
      const groupSize = group.length;

      const x = level * 300 + 100;
      const y = (indexInGroup - groupSize / 2) * 200 + 300;

      return {
        id: activity.id,
        type: "activity",
        position: { x, y },
        data: {
          label: activity.id,
          duration: activity.duration,
          es: activity.es,
          ef: activity.ef,
          ls: activity.ls,
          lf: activity.lf,
          slack: activity.slack,
          isCritical: activity.isCritical,
        },
      };
    });

    const edges = activities.flatMap((activity) =>
      activity.predecessors.map((predId) => {
        const isPredCritical =
          calculatedActivities.find((a) => a.id === predId)?.isCritical || false;
        const isCurrentCritical =
          calculatedActivities.find((a) => a.id === activity.id)?.isCritical || false;
        const isCriticalPath = isPredCritical && isCurrentCritical;

        return {
          id: `${predId}-${activity.id}`,
          source: predId,
          target: activity.id,
          animated: isCriticalPath,
          style: {
            stroke: isCriticalPath ? "hsl(var(--critical))" : "hsl(var(--border))",
            strokeWidth: isCriticalPath ? 3 : 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isCriticalPath ? "hsl(var(--critical))" : "hsl(var(--border))",
          },
        };
      })
    );

    return { nodes, edges };
  }, [calculatedActivities, levels, activities]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-[600px] bg-card rounded-lg border border-border shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const isCritical = node.data?.isCritical;
            return isCritical ? "hsl(var(--critical))" : "hsl(var(--primary))";
          }}
          className="bg-card border border-border"
        />
      </ReactFlow>
    </div>
  );
};
