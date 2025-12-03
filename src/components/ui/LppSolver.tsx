import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ConstraintSense = "<=" | ">=" | "=";

type Constraint = {
  id: number;
  a: number;
  b: number;
  c: number;
  sense: ConstraintSense;
};

type Point = { x: number; y: number };

type Solution = {
  feasiblePoints: Point[];
  bestPoint: Point | null;
  bestValue: number | null;
  isFeasible: boolean;
};

const LppSolver: React.FC = () => {
  const [zx, setZx] = useState(3); // coefficient of x in Z
  const [zy, setZy] = useState(5); // coefficient of y in Z

  const [constraints, setConstraints] = useState<Constraint[]>([
    { id: 1, a: 1, b: 1, c: 450, sense: "<=" },
    { id: 2, a: 2, b: 1, c: 600, sense: "<=" },
  ]);

  const [objectiveType, setObjectiveType] = useState<"max" | "min">("max");

  const [solution, setSolution] = useState<Solution | null>(null);

  // ---------- helpers ----------

  const parseNumber = (value: string, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const addConstraint = () => {
    setConstraints((prev) => [
      ...prev,
      { id: Date.now(), a: 1, b: 1, c: 0, sense: "<=" },
    ]);
  };

  const removeConstraint = (id: number) => {
    setConstraints((prev) => prev.filter((c) => c.id !== id));
  };

  const updateConstraint = (
    id: number,
    field: keyof Constraint,
    value: number | ConstraintSense
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
      const lhs = c.a * p.x + c.b * p.y;
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
      ...constraints.map((c) => ({ a: c.a, b: c.b, c: c.c })),
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
        Math.atan2(p1.y - cy, p1.x - cx) -
        Math.atan2(p2.y - cy, p2.x - cx)
    );

    // find best vertex for Z = zx x + zy y
    let bestPoint: Point | null = null;
    let bestValue: number | null = null;

    unique.forEach((p) => {
      const z = zx * p.x + zy * p.y;

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
        <div className="flex items-center justify-center text-sm text-slate-500 h-64">
          Enter constraints and click{" "}
          <span className="mx-1 font-semibold">Solve LPP</span> to see the
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
      if (c.a !== 0) xs.push(c.c / c.a);
      if (c.b !== 0) ys.push(c.c / c.b);
    });

    const maxX = Math.max(50, ...xs) * 1.1;
    const maxY = Math.max(50, ...ys) * 1.1;

    const sx = (x: number) =>
      margin + (x / maxX) * (width - 2 * margin);
    const sy = (y: number) =>
      height - margin - (y / maxY) * (height - 2 * margin);

    const stepX = maxX / 6;
    const stepY = maxY / 6;

    const senseSymbol = (s: ConstraintSense) =>
      s === "<=" ? "≤" : s === ">=" ? "≥" : "=";

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[500px] mx-auto bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl border border-amber-200"
      >
        {/* axes */}
        <line
          x1={sx(0)}
          y1={sy(0)}
          x2={sx(maxX * 1.02)}
          y2={sy(0)}
          stroke="black"
          strokeWidth={2}
          markerEnd="url(#arrow-x)"
        />
        <line
          x1={sx(0)}
          y1={sy(0)}
          x2={sx(0)}
          y2={sy(maxY * 1.02)}
          stroke="black"
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
            <path d="M0,0 L8,4 L0,8 z" fill="black" />
          </marker>
          <marker
            id="arrow-y"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="2"
            orient="auto"
          >
            <path d="M0,0 L4,4 L8,0 z" fill="black" />
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
                stroke="black"
              />
              <text
                x={sx(xVal)}
                y={sy(0) + 18}
                fontSize={10}
                textAnchor="middle"
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
                stroke="black"
              />
              <text
                x={sx(0) - 10}
                y={sy(yVal) + 4}
                fontSize={10}
                textAnchor="end"
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
            fill="#4ade80"
            fillOpacity={0.6}
            stroke="#16a34a"
            strokeWidth={2}
          />
        )}

        {/* constraint lines */}
        {constraints.map((c) => {
          const pts: Point[] = [];

          if (c.b !== 0) {
            const y1 = c.c / c.b;
            if (y1 >= 0) pts.push({ x: 0, y: y1 });
          }
          if (c.a !== 0) {
            const x1 = c.c / c.a;
            if (x1 >= 0) pts.push({ x: x1, y: 0 });
          }

          if (pts.length < 2) {
            // fallback in case of weird coefficients
            pts.push({ x: 0, y: c.c / (c.b || 1) });
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
                stroke="black"
                strokeWidth={2}
              />
              <text
                x={midX}
                y={midY}
                fontSize={11}
                transform={`rotate(-35 ${midX} ${midY})`}
              >
                {`${c.a}x + ${c.b}y ${senseSymbol(c.sense)} ${c.c}`}
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
            fill="#166534"
          />
        ))}

        {/* best point */}
        {bestPoint && (
          <g>
            <circle
              cx={sx(bestPoint.x)}
              cy={sy(bestPoint.y)}
              r={5}
              fill="#ef4444"
            />
            <text
              x={sx(bestPoint.x) + 6}
              y={sy(bestPoint.y) - 6}
              fontSize={11}
            >
              ({bestPoint.x.toFixed(1)}, {bestPoint.y.toFixed(1)})
            </text>
          </g>
        )}
      </svg>
    );
  };

  // ---------- UI ----------

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
      {/* Left: inputs */}
      <div className="space-y-6">
        {/* Objective function */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">
              Objective Function (
              {objectiveType === "max" ? "Maximization" : "Minimization"})
            </h3>

            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 text-xs overflow-hidden">
              <button
                type="button"
                onClick={() => setObjectiveType("max")}
                className={`px-3 py-1 ${
                  objectiveType === "max"
                    ? "bg-sky-600 text-white"
                    : "text-slate-600"
                }`}
              >
                Max
              </button>
              <button
                type="button"
                onClick={() => setObjectiveType("min")}
                className={`px-3 py-1 ${
                  objectiveType === "min"
                    ? "bg-sky-600 text-white"
                    : "text-slate-600"
                }`}
              >
                Min
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span>
              {objectiveType === "max" ? "Maximize" : "Minimize"} Z =
            </span>
            <Input
              className="w-20"
              type="number"
              value={zx}
              onChange={(e) => setZx(parseNumber(e.target.value, zx))}
            />
            <span>x +</span>
            <Input
              className="w-20"
              type="number"
              value={zy}
              onChange={(e) => setZy(parseNumber(e.target.value, zy))}
            />
            <span>y</span>
          </div>
        </div>

        {/* Constraints */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Constraints</h3>
            <Button variant="outline" size="sm" onClick={addConstraint}>
              + Add Constraint
            </Button>
          </div>

          <div className="space-y-3">
            {constraints.map((c, idx) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="w-6 text-xs font-semibold text-slate-500">
                  C{idx + 1}:
                </span>
                <Input
                  className="w-16"
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
                <span>x +</span>
                <Input
                  className="w-16"
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
                <span>y</span>

                <select
                  value={c.sense}
                  onChange={(e) =>
                    updateConstraint(
                      c.id,
                      "sense",
                      e.target.value as ConstraintSense
                    )
                  }
                  className="border rounded-md px-2 py-1 text-sm bg-white mx-1"
                >
                  <option value="<=">&le;</option>
                  <option value=">=">&ge;</option>
                  <option value="=">=</option>
                </select>

                <Input
                  className="w-20"
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
                  className="ml-1 h-7 w-7 text-slate-400 hover:text-red-500"
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
          Solve LPP & Show Graph
        </Button>

        {solution && (
          <div className="text-xs text-slate-600 space-y-1">
            {!solution.isFeasible && (
              <p className="text-red-600 font-semibold">
                No feasible region for the given constraints.
              </p>
            )}

            {solution.isFeasible && solution.bestPoint && (
              <>
                <p>
                  Optimal point (
                  {objectiveType === "max" ? "Maximum" : "Minimum"} Z):{" "}
                  <span className="font-semibold">
                    ({solution.bestPoint.x.toFixed(2)},{" "}
                    {solution.bestPoint.y.toFixed(2)})
                  </span>
                </p>
                <p>
                  {objectiveType === "max" ? "Maximum" : "Minimum"} Z ={" "}
                  <span className="font-semibold">
                    {solution.bestValue?.toFixed(2)}
                  </span>
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: graph */}
      <div className="flex items-center justify-center">{drawGraph()}</div>
    </div>
  );
};

export default LppSolver;
