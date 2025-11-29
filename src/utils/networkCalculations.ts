import { Activity, ActivityWithCalculations } from "@/types/activity";

export function calculateNetworkAnalysis(
  activities: Activity[]
): ActivityWithCalculations[] {
  if (activities.length === 0) return [];

  const activityMap = new Map<string, ActivityWithCalculations>();

  // Initialize all activities
  activities.forEach((activity) => {
    activityMap.set(activity.id, {
      ...activity,
      es: 0,
      ef: 0,
      ls: 0,
      lf: 0,
      slack: 0,
      isCritical: false,
    });
  });

  // Forward pass - Calculate ES and EF
  const processedForward = new Set<string>();
  const topoSortForward: string[] = [];

  function forwardDFS(id: string) {
    if (processedForward.has(id)) return;
    processedForward.add(id);

    const activity = activityMap.get(id)!;

    // Calculate ES: max of all predecessor EFs
    if (activity.predecessors.length === 0) {
      activity.es = 0;
    } else {
      activity.es = Math.max(
        ...activity.predecessors.map((predId) => {
          const pred = activityMap.get(predId);
          if (pred) {
            forwardDFS(predId);
            return pred.ef;
          }
          return 0;
        })
      );
    }

    activity.ef = activity.es + activity.duration;
    topoSortForward.push(id);
  }

  activities.forEach((activity) => forwardDFS(activity.id));

  // Find project completion time (max EF)
  const projectCompletionTime = Math.max(
    ...Array.from(activityMap.values()).map((a) => a.ef)
  );

  // Backward pass - Calculate LS and LF
  // Build successor map
  const successorMap = new Map<string, string[]>();
  activities.forEach((activity) => {
    successorMap.set(activity.id, []);
  });

  activities.forEach((activity) => {
    activity.predecessors.forEach((predId) => {
      const successors = successorMap.get(predId);
      if (successors) {
        successors.push(activity.id);
      }
    });
  });

  const processedBackward = new Set<string>();

  function backwardDFS(id: string) {
    if (processedBackward.has(id)) return;
    processedBackward.add(id);

    const activity = activityMap.get(id)!;
    const successors = successorMap.get(id) || [];

    // Calculate LF: min of all successor LSs
    if (successors.length === 0) {
      activity.lf = projectCompletionTime;
    } else {
      activity.lf = Math.min(
        ...successors.map((succId) => {
          const succ = activityMap.get(succId);
          if (succ) {
            backwardDFS(succId);
            return succ.ls;
          }
          return projectCompletionTime;
        })
      );
    }

    activity.ls = activity.lf - activity.duration;
    activity.slack = activity.ls - activity.es;
    activity.isCritical = activity.slack === 0;
  }

  // Process in reverse topological order
  for (let i = topoSortForward.length - 1; i >= 0; i--) {
    backwardDFS(topoSortForward[i]);
  }

  return Array.from(activityMap.values());
}

export function getTopologicalLevels(
  activities: Activity[]
): Map<string, number> {
  const levels = new Map<string, number>();
  const processed = new Set<string>();

  function dfs(id: string): number {
    if (processed.has(id)) {
      return levels.get(id) || 0;
    }

    const activity = activities.find((a) => a.id === id);
    if (!activity) return 0;

    processed.add(id);

    if (activity.predecessors.length === 0) {
      levels.set(id, 0);
      return 0;
    }

    const maxPredLevel = Math.max(
      ...activity.predecessors.map((predId) => dfs(predId))
    );
    const level = maxPredLevel + 1;
    levels.set(id, level);
    return level;
  }

  activities.forEach((activity) => dfs(activity.id));
  return levels;
}
