// src/utils/lpp.ts

export type Constraint = {
  id: number;
  a: number; // coefficient of x
  b: number; // coefficient of y
  c: number; // RHS
};

export type CandidatePoint = {
  x: number;
  y: number;
  from: string; // description of how this point came
};

export type LppResult = {
  feasiblePoints: (CandidatePoint & { z: number })[];
  bestPoint?: CandidatePoint & { z: number };
  message: string;
};

const EPS = 1e-6;

function almostEqual(x: number, y: number): boolean {
  return Math.abs(x - y) < EPS;
}

function isFeasiblePoint(
  x: number,
  y: number,
  constraints: Constraint[]
): boolean {
  if (x < -EPS || y < -EPS) return false;

  for (const c of constraints) {
    if (c.a * x + c.b * y - c.c > EPS) {
      return false;
    }
  }
  return true;
}

function dedupePoints(points: CandidatePoint[]): CandidatePoint[] {
  const unique: CandidatePoint[] = [];
  for (const p of points) {
    const exists = unique.some(
      (q) => almostEqual(p.x, q.x) && almostEqual(p.y, q.y)
    );
    if (!exists) unique.push(p);
  }
  return unique;
}

/**
 * Solve Max Z = px * x + py * y
 * subject to ai * x + bi * y <= ci, x >= 0, y >= 0
 */
export function solveLppMax(
  px: number,
  py: number,
  constraints: Constraint[]
): LppResult {
  const candidates: CandidatePoint[] = [];

  // 1. Origin
  candidates.push({ x: 0, y: 0, from: "Origin (0, 0)" });

  // 2. Axis intercepts of each constraint
  for (const c of constraints) {
    if (Math.abs(c.a) > EPS) {
      const x = c.c / c.a;
      if (x >= -EPS) {
        candidates.push({
          x,
          y: 0,
          from: `x-intercept of ${c.a}x + ${c.b}y = ${c.c}`,
        });
      }
    }
    if (Math.abs(c.b) > EPS) {
      const y = c.c / c.b;
      if (y >= -EPS) {
        candidates.push({
          x: 0,
          y,
          from: `y-intercept of ${c.a}x + ${c.b}y = ${c.c}`,
        });
      }
    }
  }

  // 3. Intersections of every pair of constraint lines
  for (let i = 0; i < constraints.length; i++) {
    for (let j = i + 1; j < constraints.length; j++) {
      const c1 = constraints[i];
      const c2 = constraints[j];

      const det = c1.a * c2.b - c2.a * c1.b;
      if (Math.abs(det) < EPS) continue; // parallel

      const x = (c1.c * c2.b - c2.c * c1.b) / det;
      const y = (c1.a * c2.c - c2.a * c1.c) / det;

      if (x >= -EPS && y >= -EPS) {
        candidates.push({
          x,
          y,
          from: `Intersection of C${c1.id} & C${c2.id}`,
        });
      }
    }
  }

  // remove duplicates
  const unique = dedupePoints(candidates);

  // 4. Keep only feasible points and compute Z
  const feasibleWithZ: (CandidatePoint & { z: number })[] = [];
  for (const p of unique) {
    if (isFeasiblePoint(p.x, p.y, constraints)) {
      const z = px * p.x + py * p.y;
      feasibleWithZ.push({ ...p, z });
    }
  }

  if (feasibleWithZ.length === 0) {
    return {
      feasiblePoints: [],
      bestPoint: undefined,
      message: "No feasible solution (region is empty).",
    };
  }

  // 5. Find best (max Z)
  let best = feasibleWithZ[0];
  for (const p of feasibleWithZ.slice(1)) {
    if (p.z > best.z + EPS) {
      best = p;
    }
  }

  return {
    feasiblePoints: feasibleWithZ,
    bestPoint: best,
    message: "Solved successfully.",
  };
}
