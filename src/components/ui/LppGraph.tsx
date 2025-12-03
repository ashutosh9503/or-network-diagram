import React, { useMemo } from "react";
import { Constraint, LppResult } from "@/utils/lpp";


type LppGraphProps = {
  constraints: Constraint[];
  result: LppResult | null;
};

const width = 420;
const height = 320;
const padding = 40;

function LppGraph({ constraints, result }: LppGraphProps) {
  const { maxX, maxY } = useMemo(() => {
    let maxX = 0;
    let maxY = 0;

    // look at constraint intercepts
    for (const c of constraints) {
      if (c.a !== 0) {
        const x = c.c / c.a;
        if (x > maxX) maxX = x;
      }
      if (c.b !== 0) {
        const y = c.c / c.b;
        if (y > maxY) maxY = y;
      }
    }

    // also look at feasible points from result
    if (result?.feasiblePoints) {
      for (const p of result.feasiblePoints) {
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
    }

    // avoid zero
    if (maxX <= 0) maxX = 5;
    if (maxY <= 0) maxY = 5;

    return { maxX, maxY };
  }, [constraints, result]);

  const toSvgX = (x: number) =>
    padding + (x / maxX) * (width - 2 * padding);

  const toSvgY = (y: number) =>
    height - padding - (y / maxY) * (height - 2 * padding);

  // build line segments for each constraint
  const lines = constraints.map((c) => {
    let points: { x: number; y: number }[] = [];

    // x-intercept: (c/a, 0)
    if (c.a !== 0) {
      const xInt = c.c / c.a;
      if (xInt >= 0) points.push({ x: xInt, y: 0 });
    }

    // y-intercept: (0, c/b)
    if (c.b !== 0) {
      const yInt = c.c / c.b;
      if (yInt >= 0) points.push({ x: 0, y: yInt });
    }

    // if we don't have two distinct points, skip
    if (points.length < 2) return null;

    return {
      id: c.id,
      p1: points[0],
      p2: points[1],
    };
  });

  const best = result?.bestPoint;

  return (
    <div className="mt-4 rounded-xl border bg-white p-3">
      <h4 className="mb-2 text-sm font-semibold text-slate-700">
        Graph (not to exact scale, for understanding only)
      </h4>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto border border-slate-200 rounded-lg bg-slate-50"
      >
        {/* axes */}
        {/* X-axis */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#0f172a"
          strokeWidth={1.2}
        />
        {/* Y-axis */}
        <line
          x1={padding}
          y1={height - padding}
          x2={padding}
          y2={padding}
          stroke="#0f172a"
          strokeWidth={1.2}
        />

        {/* axis labels */}
        <text
          x={width - padding + 10}
          y={height - padding + 4}
          fontSize={10}
          fill="#0f172a"
        >
          x
        </text>
        <text
          x={padding - 10}
          y={padding - 10}
          fontSize={10}
          fill="#0f172a"
        >
          y
        </text>

        {/* ticks on axes */}
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <React.Fragment key={t}>
            {/* x ticks */}
            <line
              x1={padding + t * (width - 2 * padding)}
              y1={height - padding}
              x2={padding + t * (width - 2 * padding)}
              y2={height - padding + 5}
              stroke="#94a3b8"
              strokeWidth={0.7}
            />
            {/* y ticks */}
            <line
              x1={padding}
              y1={height - padding - t * (height - 2 * padding)}
              x2={padding - 5}
              y2={height - padding - t * (height - 2 * padding)}
              stroke="#94a3b8"
              strokeWidth={0.7}
            />
          </React.Fragment>
        ))}

        {/* constraint lines */}
        {lines.map((line) => {
          if (!line) return null;
          const { id, p1, p2 } = line;
          return (
            <g key={id}>
              <line
                x1={toSvgX(p1.x)}
                y1={toSvgY(p1.y)}
                x2={toSvgX(p2.x)}
                y2={toSvgY(p2.y)}
                stroke="#94a3b8"
                strokeWidth={1.1}
              />
              <text
                x={(toSvgX(p1.x) + toSvgX(p2.x)) / 2 + 4}
                y={(toSvgY(p1.y) + toSvgY(p2.y)) / 2 - 4}
                fontSize={9}
                fill="#64748b"
              >
                C{id}
              </text>
            </g>
          );
        })}

        {/* feasible corner points */}
        {result?.feasiblePoints.map((p, idx) => {
          const isBest =
            best &&
            Math.abs(p.x - best.x) < 1e-6 &&
            Math.abs(p.y - best.y) < 1e-6;

          return (
            <g key={idx}>
              <circle
                cx={toSvgX(p.x)}
                cy={toSvgY(p.y)}
                r={isBest ? 5 : 3}
                fill={isBest ? "#16a34a" : "#0ea5e9"}
                stroke="#0f172a"
                strokeWidth={isBest ? 1.2 : 0.7}
              />
              <text
                x={toSvgX(p.x) + 6}
                y={toSvgY(p.y) - 4}
                fontSize={9}
                fill="#0f172a"
              >
                {isBest ? "Opt" : `P${idx + 1}`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default LppGraph;
