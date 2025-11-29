export interface Activity {
  id: string;
  duration: number;
  predecessors: string[];
}

export interface ActivityWithCalculations extends Activity {
  es: number; // Earliest Start
  ef: number; // Earliest Finish
  ls: number; // Latest Start
  lf: number; // Latest Finish
  slack: number;
  isCritical: boolean;
}

export interface NetworkNode {
  id: string;
  data: {
    label: string;
    duration: number;
    es: number;
    ef: number;
    ls: number;
    lf: number;
    slack: number;
    isCritical: boolean;
  };
  position: { x: number; y: number };
  type: string;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: React.CSSProperties;
}
