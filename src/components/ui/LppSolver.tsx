import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";

type ConstraintSense = "<=" | ">=" | "=";

type Constraint = {
  id: number;
  a: number;
  b: number;
  c: number;
  sense: ConstraintSense;
  operator: "+" | "-";
};

type Point = { x: number; y: number };

type Solution = {
  feasiblePoints: Point[];
  bestPoint: Point | null;
  bestValue: number | null;
  isFeasible: boolean;
};

const LppSolver: React.FC = () => {
  const [zx, setZx] = useState(3);
  const [zy, setZy] = useState(5);
  const [zOperator, setZOperator] = useState<"+" | "-">("+");

  const [constraints, setConstraints] = useState<Constraint[]>([
    { id: 1, a: 1, b: 1, c: 450, sense: "<=", operator: "+" },
    { id: 2, a: 2, b: 1, c: 600, sense: "<=", operator: "+" },
  ]);

  const [objectiveType, setObjectiveType] = useState<"max" | "min">("max");

  const [solution, setSolution] = useState<Solution | null>(null);

  const { theme } = useTheme();
  // Simple check for dark mode to adjust SVG colors manually if needed, 
  // though we will try to use CSS classes where possible.
  // Note: theme might be 'system', checking classList is robust but React-way is fine.
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  // ---------- helpers ----------

  const parseNumber = (value: string, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const addConstraint = () => {
    setConstraints((prev) => [
      ...prev,
      { id: Date.now(), a: 1, b: 1, c: 0, sense: "<=", operator: "+" },
    ]);
  };

  const removeConstraint = (id: number) => {
    setConstraints((prev) => prev.filter((c) => c.id !== id));
  };

  const updateConstraint = (
    id: number,
    field: keyof Constraint,
    value: number | ConstraintSense | "+" | "-"
  ) => {
    setConstraints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // ---------- core LP solving for 2 variables ----------

  const solve = () => {
    if (constraints.length === 0) return;

    // helper: check if a point satisfies a single constraint
    const satisfiesConstraint = (p: Point, c: Constraint): boolean => {
      const realB = c.operator === "+" ? c.b : -c.b;
      const lhs = c.a * p.x + realB * p.y;
      const rhs = c.c;
      const eps = 1e-6;

      switch (c.sense) {
        case "<=":
          return lhs <= rhs + eps;
        case ">=":
          return lhs + eps >= rhs;
        case "=":
          return Math.abs(lhs - rhs) <= eps;
        default:
          return false;
      }
    };

    // helper: check if a point is feasible (all constraints + x,y ≥ 0)
    const isFeasible = (p: Point): boolean =>
      p.x >= -1e-6 &&
      p.y >= -1e-6 &&
      constraints.every((c) => satisfiesConstraint(p, c));

    // all boundary lines: a x + b y = c
    const lines: { a: number; b: number; c: number }[] = [
      ...constraints.map((c) => ({
        a: c.a,
        b: c.operator === "+" ? c.b : -c.b,
        c: c.c,
      })),
      { a: 1, b: 0, c: 0 }, // x = 0
      { a: 0, b: 1, c: 0 }, // y = 0
    ];

    const points: Point[] = [];

    // intersections of all pairs of lines
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const L1 = lines[i];
        const L2 = lines[j];
        const det = L1.a * L2.b - L2.a * L1.b;
        if (Math.abs(det) < 1e-9) continue; // parallel

        const x = (L1.c * L2.b - L2.c * L1.b) / det;
        const y = (L1.a * L2.c - L2.a * L1.c) / det;

        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

        const candidate: Point = { x, y };

        if (!isFeasible(candidate)) continue;

        points.push(candidate);
      }
    }

    // remove duplicates (approximate)
    const unique: Point[] = [];
    points.forEach((p) => {
      if (!unique.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 1e-3)) {
        unique.push(p);
      }
    });

    if (unique.length === 0) {
      setSolution({
        feasiblePoints: [],
        bestPoint: null,
        bestValue: null,
        isFeasible: false,
      });
      return;
    }

    // sort points around centroid (for polygon drawing)
    const cx = unique.reduce((s, p) => s + p.x, 0) / unique.length;
    const cy = unique.reduce((s, p) => s + p.y, 0) / unique.length;

    unique.sort(
      (p1, p2) =>
        Math.atan2(p1.y - cy, p1.x - cx) - Math.atan2(p2.y - cy, p2.x - cx)
    );

    // find best vertex for Z = zx x + zy y
    let bestPoint: Point | null = null;
    let bestValue: number | null = null;

    unique.forEach((p) => {
      const realZy = zOperator === "+" ? zy : -zy;
      const z = zx * p.x + realZy * p.y;

      if (bestValue === null) {
        bestValue = z;
        bestPoint = p;
      } else if (
        (objectiveType === "max" && z > bestValue) ||
        (objectiveType === "min" && z < bestValue)
      ) {
        bestValue = z;
        bestPoint = p;
      }
    });

    setSolution({
      feasiblePoints: unique,
      bestPoint,
      bestValue,
      isFeasible: true,
    });
  };

  // ---------- drawing helpers ----------

  const drawGraph = () => {
    if (!solution || !solution.isFeasible) {
      return (
        <div className="flex items-center justify-center text-sm text-slate-500 h-64 dark:text-slate-400">
          Enter constraints and tap{" "}
          <span className="mx-1 font-semibold text-sky-600 dark:text-sky-400">Solve LPP</span> to see the
          graph.
        </div>
      );
    }

    const { feasiblePoints, bestPoint } = solution;

    const width = 420;
    const height = 320;
    const margin = 40;

    // determine scale from all points + intercepts
    const xs = feasiblePoints.map((p) => p.x);
    const ys = feasiblePoints.map((p) => p.y);

    constraints.forEach((c) => {
      const realB = c.operator === "+" ? c.b : -c.b;
      if (c.a !== 0) xs.push(c.c / c.a);
      if (realB !== 0) ys.push(c.c / realB);
    });

    const maxX = Math.max(50, ...xs) * 1.1;
    const maxY = Math.max(50, ...ys) * 1.1;

    const sx = (x: number) => margin + (x / maxX) * (width - 2 * margin);
    const sy = (y: number) =>
      height - margin - (y / maxY) * (height - 2 * margin);

    const stepX = maxX / 6;
    const stepY = maxY / 6;

    const senseSymbol = (s: ConstraintSense) =>
      s === "<=" ? "≤" : s === ">=" ? "≥" : "=";

    return (
      <div className="w-full max-w-full overflow-x-auto">
        {/* inner wrapper keeps SVG centered but allows horizontal scroll on very small screens */}
        <div className="min-w-[320px] max-w-[520px] mx-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/10 dark:to-amber-950/20 rounded-3xl border border-amber-200 dark:border-amber-900/30"
          >
            {/* axes */}
            <line
              x1={sx(0)}
              y1={sy(0)}
              x2={sx(maxX * 1.02)}
              y2={sy(0)}
              className="stroke-slate-900 dark:stroke-slate-300"
              strokeWidth={2}
              markerEnd="url(#arrow-x)"
            />
            <line
              x1={sx(0)}
              y1={sy(0)}
              x2={sx(0)}
              y2={sy(maxY * 1.02)}
              className="stroke-slate-900 dark:stroke-slate-300"
              strokeWidth={2}
              markerEnd="url(#arrow-y)"
            />

            <defs>
              <marker
                id="arrow-x"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 z" className="fill-slate-900 dark:fill-slate-300" />
              </marker>
              <marker
                id="arrow-y"
                markerWidth="8"
                markerHeight="8"
                refX="4"
                refY="2"
                orient="auto"
              >
                <path d="M0,0 L4,4 L8,0 z" className="fill-slate-900 dark:fill-slate-300" />
              </marker>
            </defs>

            {/* ticks & labels on X */}
            {Array.from({ length: 6 }).map((_, i) => {
              const xVal = stepX * (i + 1);
              return (
                <g key={`xtick-${i}`}>
                  <line
                    x1={sx(xVal)}
                    y1={sy(0) - 4}
                    x2={sx(xVal)}
                    y2={sy(0) + 4}
                    className="stroke-slate-900 dark:stroke-slate-400"
                  />
                  <text
                    x={sx(xVal)}
                    y={sy(0) + 18}
                    fontSize={10}
                    textAnchor="middle"
                    className="fill-slate-700 dark:fill-slate-400"
                  >
                    {Math.round(xVal)}
                  </text>
                </g>
              );
            })}

            {/* ticks & labels on Y */}
            {Array.from({ length: 6 }).map((_, i) => {
              const yVal = stepY * (i + 1);
              return (
                <g key={`ytick-${i}`}>
                  <line
                    x1={sx(0) - 4}
                    y1={sy(yVal)}
                    x2={sx(0) + 4}
                    y2={sy(yVal)}
                    className="stroke-slate-900 dark:stroke-slate-400"
                  />
                  <text
                    x={sx(0) - 10}
                    y={sy(yVal) + 4}
                    fontSize={10}
                    textAnchor="end"
                    className="fill-slate-700 dark:fill-slate-400"
                  >
                    {Math.round(yVal)}
                  </text>
                </g>
              );
            })}

            {/* FEASIBLE REGION */}
            {feasiblePoints.length >= 3 && (
              <polygon
                points={feasiblePoints
                  .map((p) => `${sx(p.x)},${sy(p.y)}`)
                  .join(" ")}
                fill="currentColor"
                className="text-emerald-400 dark:text-emerald-500/40 opacity-60"
                stroke="currentColor"
                strokeWidth={2}
              />
            )}

            {/* constraint lines */}
            {constraints.map((c) => {
              const pts: Point[] = [];
              const realB = c.operator === "+" ? c.b : -c.b;

              if (realB !== 0) {
                const y1 = c.c / realB;
                if (y1 >= 0) pts.push({ x: 0, y: y1 });
              }
              if (c.a !== 0) {
                const x1 = c.c / c.a;
                if (x1 >= 0) pts.push({ x: x1, y: 0 });
              }

              if (pts.length < 2) {
                // fallback in case of weird coefficients
                pts.push({ x: 0, y: c.c / (realB || 1) });
                pts.push({ x: c.c / (c.a || 1), y: 0 });
              }

              const midX = (sx(pts[0].x) + sx(pts[1].x)) / 2;
              const midY = (sy(pts[0].y) + sy(pts[1].y)) / 2 - 6;

              return (
                <g key={`line-${c.id}`}>
                  <line
                    x1={sx(pts[0].x)}
                    y1={sy(pts[0].y)}
                    x2={sx(pts[1].x)}
                    y2={sy(pts[1].y)}
                    className="stroke-slate-500 dark:stroke-slate-500"
                    strokeWidth={2}
                  />
                  <text
                    x={midX}
                    y={midY}
                    fontSize={11}
                    transform={`rotate(-35 ${midX} ${midY})`}
                    className="fill-slate-600 dark:fill-slate-400"
                  >
                    {`${c.a}x ${c.operator} ${c.b}y ${senseSymbol(c.sense)} ${c.c}`}
                  </text>
                </g>
              );
            })}

            {/* vertices */}
            {feasiblePoints.map((p, i) => (
              <circle
                key={`vertex-${i}`}
                cx={sx(p.x)}
                cy={sy(p.y)}
                r={3}
                className="fill-emerald-800 dark:fill-emerald-400"
              />
            ))}

            {/* best point */}
            {bestPoint && (
              <g>
                <circle
                  cx={sx(bestPoint.x)}
                  cy={sy(bestPoint.y)}
                  r={5}
                  className="fill-rose-500 dark:fill-rose-500 animate-pulse"
                />
                <text
                  x={sx(bestPoint.x) + 6}
                  y={sy(bestPoint.y) - 6}
                  fontSize={11}
                  fontWeight="bold"
                  className="fill-slate-900 dark:fill-white"
                >
                  ({bestPoint.x.toFixed(1)}, {bestPoint.y.toFixed(1)})
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>
    );
  };

  // ---------- UI ----------

  return (
    <div className="w-full grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
      {/* Left: inputs */}
      <div className="space-y-6">
        {/* Objective function */}
        <div>
          <div className="flex items-center justify-between mb-2 gap-3">
            <h3 className="text-base sm:text-lg font-semibold">
              Objective Function
            </h3>

            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-xs overflow-hidden">
              <button
                type="button"
                onClick={() => setObjectiveType("max")}
                className={`px-3 py-1 transition-colors ${objectiveType === "max"
                  ? "bg-sky-600 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
              >
                Max
              </button>
              <button
                type="button"
                onClick={() => setObjectiveType("min")}
                className={`px-3 py-1 transition-colors ${objectiveType === "min"
                  ? "bg-sky-600 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
              >
                Min
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm p-3 rounded-lg bg-muted/40 border border-border">
            <span className="font-mono font-medium">
              {objectiveType === "max" ? "Maximize" : "Minimize"} Z =
            </span>
            <div className="flex items-center gap-1">
              <Input
                className="w-16 h-8 bg-background"
                type="number"
                value={zx}
                onChange={(e) => setZx(parseNumber(e.target.value, zx))}
              />
              <span className="font-serif italic">x</span>
            </div>
            <select
              value={zOperator}
              onChange={(e) => setZOperator(e.target.value as "+" | "-")}
              className="h-8 w-12 rounded-md border border-input bg-background px-2 py-1 text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="+">+</option>
              <option value="-">-</option>
            </select>
            <div className="flex items-center gap-1">
              <Input
                className="w-16 h-8 bg-background"
                type="number"
                value={zy}
                onChange={(e) => setZy(parseNumber(e.target.value, zy))}
              />
              <span className="font-serif italic">y</span>
            </div>
          </div>
        </div>

        {/* Constraints */}
        <div>
          <div className="flex items-center justify-between mb-2 gap-3">
            <h3 className="text-base sm:text-lg font-semibold">Constraints</h3>
            <Button variant="outline" size="sm" onClick={addConstraint}>
              + Add Constraint
            </Button>
          </div>

          <div className="space-y-3">
            {constraints.map((c, idx) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm shadow-sm"
              >
                <span className="w-6 text-xs font-semibold text-muted-foreground">
                  C{idx + 1}:
                </span>
                <Input
                  className="w-16 h-8"
                  type="number"
                  value={c.a}
                  onChange={(e) =>
                    updateConstraint(
                      c.id,
                      "a",
                      parseNumber(e.target.value, c.a)
                    )
                  }
                />
                <span className="font-serif italic">x</span>
                <select
                  value={c.operator}
                  onChange={(e) =>
                    updateConstraint(c.id, "operator", e.target.value as "+" | "-")
                  }
                  className="h-8 w-12 rounded-md border border-input bg-background px-2 py-1 text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mx-1"
                >
                  <option value="+">+</option>
                  <option value="-">-</option>
                </select>
                <Input
                  className="w-16 h-8"
                  type="number"
                  value={c.b}
                  onChange={(e) =>
                    updateConstraint(
                      c.id,
                      "b",
                      parseNumber(e.target.value, c.b)
                    )
                  }
                />
                <span className="font-serif italic">y</span>

                <select
                  value={c.sense}
                  onChange={(e) =>
                    updateConstraint(
                      c.id,
                      "sense",
                      e.target.value as ConstraintSense
                    )
                  }
                  className="border border-input rounded-md px-1 py-1 text-sm bg-background mx-1 h-8"
                >
                  <option value="<=">&le;</option>
                  <option value=">=">&ge;</option>
                  <option value="=">=</option>
                </select>

                <Input
                  className="w-16 h-8"
                  type="number"
                  value={c.c}
                  onChange={(e) =>
                    updateConstraint(
                      c.id,
                      "c",
                      parseNumber(e.target.value, c.c)
                    )
                  }
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="ml-auto h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeConstraint(c.id)}
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Solve button + result text */}
        <Button
          className="w-full bg-sky-600 hover:bg-sky-700 text-white"
          onClick={solve}
        >
          Solve LPP &amp; Show Graph
        </Button>

        {solution && (
          <div className="text-sm space-y-2 p-4 rounded-xl border border-border bg-muted/30">
            {!solution.isFeasible && (
              <p className="text-destructive font-semibold flex items-center gap-2">
                <span>⚠️</span> No feasible region found.
              </p>
            )}

            {solution.isFeasible && solution.bestPoint && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Optimal Point:</span>
                  <span className="font-mono font-bold">
                    ({solution.bestPoint.x.toFixed(2)},{" "}
                    {solution.bestPoint.y.toFixed(2)})
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold text-foreground">
                    {objectiveType === "max" ? "Maximum" : "Minimum"} Z:
                  </span>
                  <span className="font-bold text-sky-600 dark:text-sky-400">
                    {solution.bestValue?.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: graph */}
      <div className="flex items-center justify-center p-4 rounded-2xl border border-border bg-card shadow-sm">
        {drawGraph()}
      </div>
    </div>
  );
};

export default LppSolver;
