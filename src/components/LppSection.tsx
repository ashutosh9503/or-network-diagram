import React, { useState } from "react";

type Constraint = { a: number; b: number; c: number };
type Point = { x: number; y: number };

type Solution = {
  feasiblePoints: Point[];
  optimalPoint?: Point;
  optimalValue?: number;
};

function solveLpp(constraints: Constraint[], p: number, q: number): Solution {
  const allConstraints: Constraint[] = [
    ...constraints,
    { a: 1, b: 0, c: Infinity }, // x >= 0
    { a: 0, b: 1, c: Infinity }, // y >= 0
  ];

  const candidates: Point[] = [];

  // axis intercepts for each finite constraint
  for (const c of constraints) {
    if (c.b !== 0) candidates.push({ x: 0, y: c.c / c.b });
    if (c.a !== 0) candidates.push({ x: c.c / c.a, y: 0 });
  }

  // intersections of constraint pairs
  for (let i = 0; i < constraints.length; i++) {
    for (let j = i + 1; j < constraints.length; j++) {
      const c1 = constraints[i];
      const c2 = constraints[j];
      const det = c1.a * c2.b - c2.a * c1.b;
      if (Math.abs(det) < 1e-9) continue; // parallel
      const x = (c1.c * c2.b - c2.c * c1.b) / det;
      const y = (c1.a * c2.c - c2.a * c1.c) / det;
      candidates.push({ x, y });
    }
  }

  // origin is also candidate
  candidates.push({ x: 0, y: 0 });

  // keep only feasible points (respect all <= constraints and x,y >= 0)
  const feasible: Point[] = [];
  outer: for (const pt of candidates) {
    if (pt.x < -1e-6 || pt.y < -1e-6) continue;
    for (const c of constraints) {
      if (c.a * pt.x + c.b * pt.y - c.c > 1e-6) continue outer;
    }
    feasible.push({ x: Math.max(0, pt.x), y: Math.max(0, pt.y) });
  }

  // remove near-duplicate points
  const unique: Point[] = [];
  for (const p1 of feasible) {
    if (
      !unique.some(
        (q1) => Math.hypot(q1.x - p1.x, q1.y - p1.y) < 1e-3
      )
    ) {
      unique.push(p1);
    }
  }

  // sort polygon vertices around centroid so polygon draws nicely
  let polygon: Point[] = [];
  if (unique.length >= 3) {
    const cx = unique.reduce((s, p) => s + p.x, 0) / unique.length;
    const cy = unique.reduce((s, p) => s + p.y, 0) / unique.length;
    polygon = [...unique].sort((p1, p2) => {
      const a1 = Math.atan2(p1.y - cy, p1.x - cx);
      const a2 = Math.atan2(p2.y - cy, p2.x - cx);
      return a1 - a2;
    });
  } else {
    polygon = unique;
  }

  // find optimal point (max Z = p x + q y)
  let best: Point | undefined;
  let bestZ = -Infinity;
  for (const pt of polygon) {
    const z = p * pt.x + q * pt.y;
    if (z > bestZ) {
      bestZ = z;
      best = pt;
    }
  }

  return {
    feasiblePoints: polygon,
    optimalPoint: best,
    optimalValue: isFinite(bestZ) ? bestZ : undefined,
  };
}

// --- Graph component using SVG ---

interface LppGraphProps {
  feasiblePoints: Point[];
  optimalPoint?: Point;
}

const LppGraph: React.FC<LppGraphProps> = ({ feasiblePoints, optimalPoint }) => {
  const width = 460;
  const height = 320;
  const margin = 40;

  if (feasiblePoints.length === 0) {
    return (
      <div className="text-sm text-slate-500">
        No feasible region yet. Enter constraints and click{" "}
        <span className="font-semibold">Solve &amp; Plot</span>.
      </div>
    );
  }

  const maxX =
    Math.max(...feasiblePoints.map((p) => p.x), optimalPoint?.x ?? 0) || 1;
  const maxY =
    Math.max(...feasiblePoints.map((p) => p.y), optimalPoint?.y ?? 0) || 1;

  const scaleX = (x: number) =>
    margin + (x / (maxX * 1.1)) * (width - 2 * margin);
  const scaleY = (y: number) =>
    height - margin - (y / (maxY * 1.1)) * (height - 2 * margin);

  const polygonPoints = feasiblePoints
    .map((p) => `${scaleX(p.x)},${scaleY(p.y)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full rounded-xl border border-slate-200 bg-white"
    >
      {/* axes */}
      <line
        x1={margin}
        y1={height - margin}
        x2={width - margin / 2}
        y2={height - margin}
        stroke="#0f172a"
        strokeWidth={1.2}
      />
      <line
        x1={margin}
        y1={height - margin}
        x2={margin}
        y2={margin / 2}
        stroke="#0f172a"
        strokeWidth={1.2}
      />

      {/* X & Y labels */}
      <text
        x={width - margin / 2}
        y={height - margin + 18}
        fontSize={12}
        fill="#0f172a"
      >
        X
      </text>
      <text x={margin - 16} y={margin / 2} fontSize={12} fill="#0f172a">
        Y
      </text>

      {/* feasible region */}
      {feasiblePoints.length >= 3 && (
        <polygon
          points={polygonPoints}
          fill="#22c55e55"
          stroke="#16a34a"
          strokeWidth={1.5}
        />
      )}

      {/* vertices labels */}
      {feasiblePoints.map((p, i) => (
        <g key={i}>
          <circle
            cx={scaleX(p.x)}
            cy={scaleY(p.y)}
            r={3}
            fill="#16a34a"
            stroke="white"
            strokeWidth={1}
          />
          <text
            x={scaleX(p.x) + 4}
            y={scaleY(p.y) - 4}
            fontSize={10}
            fill="#15803d"
          >
            ({p.x.toFixed(0)}, {p.y.toFixed(0)})
          </text>
        </g>
      ))}

      {/* optimal point */}
      {optimalPoint && (
        <g>
          <circle
            cx={scaleX(optimalPoint.x)}
            cy={scaleY(optimalPoint.y)}
            r={4}
            fill="#ef4444"
            stroke="white"
            strokeWidth={1}
          />
          <text
            x={scaleX(optimalPoint.x) + 6}
            y={scaleY(optimalPoint.y) - 6}
            fontSize={11}
            fill="#b91c1c"
          >
            Z max ({optimalPoint.x.toFixed(0)}, {optimalPoint.y.toFixed(0)})
          </text>
        </g>
      )}
    </svg>
  );
};

// --- Section combining form + graph ---

export const LppSection: React.FC = () => {
  const [p, setP] = useState(3);
  const [q, setQ] = useState(5);

  const [constraints, setConstraints] = useState<Constraint[]>([
    { a: 1, b: 1, c: 40 },
    { a: 1, b: 0, c: 30 },
    { a: 0, b: 1, c: 40 },
  ]);

  const [solution, setSolution] = useState<Solution>({
    feasiblePoints: [],
  });

  const handleSolve = () => {
    const finite = constraints.filter((c) => Number.isFinite(c.c));
    const sol = solveLpp(finite, p, q);
    setSolution(sol);
  };

  const updateConstraint = (
    index: number,
    field: keyof Constraint,
    value: number
  ) => {
    setConstraints((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const addConstraint = () => {
    setConstraints((prev) => [...prev, { a: 1, b: 1, c: 10 }]);
  };

  const removeConstraint = (index: number) => {
    setConstraints((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)]">
      {/* Left: Form */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Linear Programming – Graphical Solver
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Currently supports 2-variable maximization problems with
            &nbsp;≤ constraints and x, y ≥ 0.
          </p>
        </div>

        {/* Objective */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">
            Objective Function
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span>Maximize Z =</span>
            <input
              type="number"
              value={p}
              onChange={(e) => setP(Number(e.target.value))}
              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
            />
            <span>x +</span>
            <input
              type="number"
              value={q}
              onChange={(e) => setQ(Number(e.target.value))}
              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
            />
            <span>y</span>
          </div>
        </div>

        {/* Constraints */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">
              Constraints
            </h3>
            <button
              onClick={addConstraint}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              + Add constraint
            </button>
          </div>

          <div className="space-y-3">
            {constraints.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="w-7 text-xs font-semibold text-slate-500">
                  C{i + 1}:
                </span>
                <input
                  type="number"
                  value={c.a}
                  onChange={(e) =>
                    updateConstraint(i, "a", Number(e.target.value))
                  }
                  className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
                />
                <span>x +</span>
                <input
                  type="number"
                  value={c.b}
                  onChange={(e) =>
                    updateConstraint(i, "b", Number(e.target.value))
                  }
                  className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
                />
                <span>y ≤</span>
                <input
                  type="number"
                  value={c.c}
                  onChange={(e) =>
                    updateConstraint(i, "c", Number(e.target.value))
                  }
                  className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
                />
                <button
                  onClick={() => removeConstraint(i)}
                  className="ml-auto text-xs text-slate-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleSolve}
            className="mt-3 w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Solve &amp; Plot Graph
          </button>

          {solution.optimalPoint && solution.optimalValue !== undefined && (
            <p className="mt-3 text-xs text-slate-600">
              Optimal solution:{" "}
              <span className="font-semibold">
                x = {solution.optimalPoint.x.toFixed(2)}, y ={" "}
                {solution.optimalPoint.y.toFixed(2)}
              </span>
              &nbsp; with &nbsp;
              <span className="font-semibold">
                Z = {solution.optimalValue.toFixed(2)}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Right: Graph */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">
          Graphical Representation
        </h3>
        <p className="text-xs text-slate-500">
          The green region shows the feasible set. The red point marks the
          optimal solution for the given objective function.
        </p>
        <LppGraph
          feasiblePoints={solution.feasiblePoints}
          optimalPoint={solution.optimalPoint}
        />
      </div>
    </div>
  );
};
