import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Method = "nw" | "least" | "vogel";

type Cell = {
  cost: number;
  alloc: number;
};

type TPResult = {
  allocations: Cell[][];
  totalCost: number;
  method: Method;
  message?: string;
};

const MAX_SIZE = 6; // max rows/cols allowed

const TransportationSolver: React.FC = () => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  const [costs, setCosts] = useState<number[][]>([
    [19, 30, 50],
    [70, 30, 40],
    [40,  8, 70],
  ]);

  const [supply, setSupply] = useState<number[]>([7, 9, 18]);
  const [demand, setDemand] = useState<number[]>([5, 8, 21]);

  const [method, setMethod] = useState<Method>("nw");
  const [result, setResult] = useState<TPResult | null>(null);

  // ---------- helpers ----------

  const parseNumber = (value: string, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const ensureSize = (r: number, c: number) => {
    // resize costs
    setCosts((prev) => {
      const newCosts: number[][] = [];
      for (let i = 0; i < r; i++) {
        newCosts[i] = [];
        for (let j = 0; j < c; j++) {
          newCosts[i][j] =
            prev[i]?.[j] !== undefined ? prev[i][j] : 0;
        }
      }
      return newCosts;
    });

    // resize supply
    setSupply((prev) => {
      const next = [...prev];
      while (next.length < r) next.push(0);
      if (next.length > r) next.length = r;
      return next;
    });

    // resize demand
    setDemand((prev) => {
      const next = [...prev];
      while (next.length < c) next.push(0);
      if (next.length > c) next.length = c;
      return next;
    });
  };

  const handleChangeRows = (value: string) => {
    const r = Math.min(MAX_SIZE, Math.max(1, parseNumber(value, rows)));
    setRows(r);
    ensureSize(r, cols);
  };

  const handleChangeCols = (value: string) => {
    const c = Math.min(MAX_SIZE, Math.max(1, parseNumber(value, cols)));
    setCols(c);
    ensureSize(rows, c);
  };

  // ---------- METHODS IMPLEMENTATION ----------

  const isBalanced = (sup: number[], dem: number[]) => {
    const s = sup.reduce((a, b) => a + b, 0);
    const d = dem.reduce((a, b) => a + b, 0);
    return Math.abs(s - d) < 1e-6;
  };

  const initAllocMatrix = (r: number, c: number, costs: number[][]): Cell[][] =>
    Array.from({ length: r }, (_, i) =>
      Array.from({ length: c }, (_, j) => ({
        cost: costs[i][j] ?? 0,
        alloc: 0,
      }))
    );

  // --- North-West Corner ---
  const solveNWCorner = (sup: number[], dem: number[]): TPResult => {
    const r = sup.length;
    const c = dem.length;
    const supplyLeft = [...sup];
    const demandLeft = [...dem];
    const alloc = initAllocMatrix(r, c, costs);

    let i = 0;
    let j = 0;

    while (i < r && j < c) {
      const x = Math.min(supplyLeft[i], demandLeft[j]);
      alloc[i][j].alloc = x;
      supplyLeft[i] -= x;
      demandLeft[j] -= x;

      if (supplyLeft[i] === 0 && demandLeft[j] === 0) {
        // degeneracy: move diagonally
        if (i + 1 < r) {
          i++;
        } else if (j + 1 < c) {
          j++;
        } else {
          break;
        }
      } else if (supplyLeft[i] === 0) {
        i++;
      } else if (demandLeft[j] === 0) {
        j++;
      }
    }

    const totalCost = alloc.reduce(
      (sum, row, i) =>
        sum +
        row.reduce((s, cell, j) => s + cell.alloc * cell.cost, 0),
      0
    );

    return { allocations: alloc, totalCost, method: "nw" };
  };

  // --- Least Cost Method ---
  const solveLeastCost = (sup: number[], dem: number[]): TPResult => {
    const r = sup.length;
    const c = dem.length;
    const supplyLeft = [...sup];
    const demandLeft = [...dem];
    const alloc = initAllocMatrix(r, c, costs);

    const used: boolean[][] = Array.from({ length: r }, () =>
      Array.from({ length: c }, () => false)
    );

    let remaining = r * c;

    while (remaining > 0) {
      let minCost = Infinity;
      let minI = -1;
      let minJ = -1;

      for (let i = 0; i < r; i++) {
        if (supplyLeft[i] <= 0) continue;
        for (let j = 0; j < c; j++) {
          if (demandLeft[j] <= 0 || used[i][j]) continue;
          if (costs[i][j] < minCost) {
            minCost = costs[i][j];
            minI = i;
            minJ = j;
          }
        }
      }

      if (minI === -1 || minJ === -1) break;

      const x = Math.min(supplyLeft[minI], demandLeft[minJ]);
      alloc[minI][minJ].alloc = x;

      supplyLeft[minI] -= x;
      demandLeft[minJ] -= x;
      used[minI][minJ] = true;
      remaining--;

      if (supplyLeft[minI] === 0) {
        for (let j = 0; j < c; j++) used[minI][j] = true;
      }
      if (demandLeft[minJ] === 0) {
        for (let i = 0; i < r; i++) used[i][minJ] = true;
      }
    }

    const totalCost = alloc.reduce(
      (sum, row) => sum + row.reduce((s, cell) => s + cell.alloc * cell.cost, 0),
      0
    );

    return { allocations: alloc, totalCost, method: "least" };
  };

  // --- Vogel's Approximation Method (VAM) ---
  const solveVogel = (sup: number[], dem: number[]): TPResult => {
    const r = sup.length;
    const c = dem.length;
    const supplyLeft = [...sup];
    const demandLeft = [...dem];
    const alloc = initAllocMatrix(r, c, costs);

    const activeRow = Array.from({ length: r }, () => true);
    const activeCol = Array.from({ length: c }, () => true);

    const BIG = 1e9;

    const getPenalties = () => {
      const rowPen: number[] = Array(r).fill(-1);
      const colPen: number[] = Array(c).fill(-1);

      // rows
      for (let i = 0; i < r; i++) {
        if (!activeRow[i] || supplyLeft[i] <= 0) continue;
        const rowCosts: number[] = [];
        for (let j = 0; j < c; j++) {
          if (!activeCol[j] || demandLeft[j] <= 0) continue;
          rowCosts.push(costs[i][j]);
        }
        if (rowCosts.length >= 2) {
          rowCosts.sort((a, b) => a - b);
          rowPen[i] = rowCosts[1] - rowCosts[0];
        } else if (rowCosts.length === 1) {
          rowPen[i] = rowCosts[0];
        }
      }

      // columns
      for (let j = 0; j < c; j++) {
        if (!activeCol[j] || demandLeft[j] <= 0) continue;
        const colCosts: number[] = [];
        for (let i = 0; i < r; i++) {
          if (!activeRow[i] || supplyLeft[i] <= 0) continue;
          colCosts.push(costs[i][j]);
        }
        if (colCosts.length >= 2) {
          colCosts.sort((a, b) => a - b);
          colPen[j] = colCosts[1] - colCosts[0];
        } else if (colCosts.length === 1) {
          colPen[j] = colCosts[0];
        }
      }

      return { rowPen, colPen };
    };

    let remaining = sup.reduce((a, b) => a + b, 0);

    while (remaining > 0) {
      const { rowPen, colPen } = getPenalties();

      // find maximum penalty
      let maxPen = -1;
      let isRow = true;
      let idx = -1;

      for (let i = 0; i < r; i++) {
        if (rowPen[i] > maxPen) {
          maxPen = rowPen[i];
          isRow = true;
          idx = i;
        }
      }
      for (let j = 0; j < c; j++) {
        if (colPen[j] > maxPen) {
          maxPen = colPen[j];
          isRow = false;
          idx = j;
        }
      }

      if (idx === -1 || maxPen < 0) break;

      // choose min cost cell in that row / col
      let selI = -1;
      let selJ = -1;
      let minCost = BIG;

      if (isRow) {
        const i = idx;
        for (let j = 0; j < c; j++) {
          if (!activeCol[j] || demandLeft[j] <= 0) continue;
          if (costs[i][j] < minCost) {
            minCost = costs[i][j];
            selI = i;
            selJ = j;
          }
        }
      } else {
        const j = idx;
        for (let i = 0; i < r; i++) {
          if (!activeRow[i] || supplyLeft[i] <= 0) continue;
          if (costs[i][j] < minCost) {
            minCost = costs[i][j];
            selI = i;
            selJ = j;
          }
        }
      }

      if (selI === -1 || selJ === -1) break;

      const x = Math.min(supplyLeft[selI], demandLeft[selJ]);
      alloc[selI][selJ].alloc = x;
      supplyLeft[selI] -= x;
      demandLeft[selJ] -= x;
      remaining -= x;

      if (supplyLeft[selI] === 0) activeRow[selI] = false;
      if (demandLeft[selJ] === 0) activeCol[selJ] = false;
    }

    const totalCost = alloc.reduce(
      (sum, row) => sum + row.reduce((s, cell) => s + cell.alloc * cell.cost, 0),
      0
    );

    return { allocations: alloc, totalCost, method: "vogel" };
  };

  const solve = () => {
    const sup = [...supply];
    const dem = [...demand];

    if (!isBalanced(sup, dem)) {
      setResult({
        allocations: [],
        totalCost: 0,
        method,
        message:
          "Currently this solver supports only *balanced* problems. Please ensure total supply = total demand (add dummy row/column if needed).",
      });
      return;
    }

    let res: TPResult;
    if (method === "nw") res = solveNWCorner(sup, dem);
    else if (method === "least") res = solveLeastCost(sup, dem);
    else res = solveVogel(sup, dem);

    setResult(res);
  };

  // ---------- UI ----------

  const methodLabel = (m: Method) =>
    m === "nw" ? "North-West Corner" : m === "least" ? "Least Cost" : "Vogel’s Approx.";

  const hasResult = result && result.allocations.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">
          Transportation Problem Solver
        </h2>
        <p className="text-xs text-slate-500">
          Supports balanced minimization problems using North-West Corner,
          Least Cost, and Vogel&apos;s Approximation methods.
        </p>
      </div>

      {/* Size controls */}
      <div className="flex flex-wrap gap-3 text-sm items-center">
        <span className="font-medium">Problem Size:</span>
        <div className="flex items-center gap-1">
          <span>Sources (rows)</span>
          <Input
            className="w-16"
            type="number"
            min={1}
            max={MAX_SIZE}
            value={rows}
            onChange={(e) => handleChangeRows(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1">
          <span>Destinations (cols)</span>
          <Input
            className="w-16"
            type="number"
            min={1}
            max={MAX_SIZE}
            value={cols}
            onChange={(e) => handleChangeCols(e.target.value)}
          />
        </div>
      </div>

      {/* Costs + supply / demand table */}
      <div className="w-full overflow-x-auto">
        <div className="inline-block min-w-[320px] rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2 text-left text-slate-500">Source</th>
                {Array.from({ length: cols }).map((_, j) => (
                  <th key={j} className="p-2 text-center text-slate-500">
                    D{j + 1}
                  </th>
                ))}
                <th className="p-2 text-center text-slate-500">Supply</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1 font-medium text-slate-600">
                    S{i + 1}
                  </td>
                  {Array.from({ length: cols }).map((_, j) => (
                    <td key={j} className="px-1 py-1">
                      <Input
                        className="w-16 mx-auto"
                        type="number"
                        value={costs[i]?.[j] ?? 0}
                        onChange={(e) =>
                          setCosts((prev) => {
                            const next = prev.map((row) => [...row]);
                            next[i][j] = parseNumber(
                              e.target.value,
                              costs[i][j] ?? 0
                            );
                            return next;
                          })
                        }
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1">
                    <Input
                      className="w-20 mx-auto"
                      type="number"
                      value={supply[i] ?? 0}
                      onChange={(e) =>
                        setSupply((prev) => {
                          const next = [...prev];
                          next[i] = parseNumber(e.target.value, supply[i] ?? 0);
                          return next;
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-slate-50">
                <td className="px-2 py-1 font-medium text-slate-600">
                  Demand
                </td>
                {Array.from({ length: cols }).map((_, j) => (
                  <td key={j} className="px-2 py-1">
                    <Input
                      className="w-20 mx-auto"
                      type="number"
                      value={demand[j] ?? 0}
                      onChange={(e) =>
                        setDemand((prev) => {
                          const next = [...prev];
                          next[j] = parseNumber(
                            e.target.value,
                            demand[j] ?? 0
                          );
                          return next;
                        })
                      }
                    />
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Method selection */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Select Method</p>
        <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
          {(["nw", "least", "vogel"] as Method[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`px-3 py-1 rounded-full border text-xs sm:text-sm ${
                method === m
                  ? "bg-sky-600 text-white border-sky-600"
                  : "bg-white text-slate-700 border-slate-300"
              }`}
            >
              {methodLabel(m)}
            </button>
          ))}
        </div>
      </div>

      {/* Solve button */}
      <Button
        className="w-full bg-sky-600 hover:bg-sky-700 text-white"
        onClick={solve}
      >
        Solve Transportation Problem
      </Button>

      {/* Result */}
      {result && (
        <div className="space-y-3 text-xs sm:text-sm">
          {result.message && (
            <p className="text-red-600 whitespace-pre-line">
              {result.message}
            </p>
          )}

          {hasResult && (
            <>
              <p>
                Method used:{" "}
                <span className="font-semibold">
                  {methodLabel(result.method)}
                </span>
              </p>
              <p>
                Total Transportation Cost ={" "}
                <span className="font-semibold">
                  {result.totalCost.toFixed(2)}
                </span>
              </p>

              <div className="w-full overflow-x-auto">
                <div className="inline-block min-w-[320px] rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-2 text-left text-slate-500">Source</th>
                        {Array.from({ length: cols }).map((_, j) => (
                          <th
                            key={j}
                            className="p-2 text-center text-slate-500"
                          >
                            D{j + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.allocations.map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-2 py-1 font-medium text-slate-600">
                            S{i + 1}
                          </td>
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className={`px-2 py-1 text-center align-middle ${
                                cell.alloc > 0
                                  ? "bg-emerald-50 border border-emerald-200"
                                  : ""
                              }`}
                            >
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                <span className="text-[11px] text-slate-500">
                                  c = {cell.cost}
                                </span>
                                {cell.alloc > 0 && (
                                  <span className="text-[11px] font-semibold text-emerald-700">
                                    x = {cell.alloc}
                                  </span>
                                )}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TransportationSolver;
