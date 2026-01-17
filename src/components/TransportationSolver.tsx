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
  isBalanced?: boolean;
};

const MAX_SIZE = 6; // max rows/cols allowed

const TransportationSolver: React.FC = () => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  const [costs, setCosts] = useState<number[][]>([
    [19, 30, 50],
    [70, 30, 40],
    [40, 8, 70],
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

  const initAllocMatrix = (r: number, c: number, currentCosts: number[][]): Cell[][] =>
    Array.from({ length: r }, (_, i) =>
      Array.from({ length: c }, (_, j) => ({
        cost: currentCosts[i][j] ?? 0,
        alloc: 0,
      }))
    );

  // --- North-West Corner ---
  const solveNWCorner = (sup: number[], dem: number[], currentCosts: number[][]): TPResult => {
    const r = sup.length;
    const c = dem.length;
    const supplyLeft = [...sup];
    const demandLeft = [...dem];
    const alloc = initAllocMatrix(r, c, currentCosts);

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
      (sum, row) =>
        sum +
        row.reduce((s, cell) => s + cell.alloc * cell.cost, 0),
      0
    );

    return { allocations: alloc, totalCost, method: "nw" };
  };

  // --- Least Cost Method ---
  const solveLeastCost = (sup: number[], dem: number[], currentCosts: number[][]): TPResult => {
    const r = sup.length;
    const c = dem.length;
    const supplyLeft = [...sup];
    const demandLeft = [...dem];
    const alloc = initAllocMatrix(r, c, currentCosts);

    const used: boolean[][] = Array.from({ length: r }, () =>
      Array.from({ length: c }, () => false)
    );

    let remaining = r * c;

    // Use a simpler approach: iterate while total supply > 0 (assuming balanced)
    // Actually, iterate until all supplies and demands are satisfied roughly.
    // The previous loop condition was `remaining > 0` which refers to cells.
    // Let's stick to standard LCM logic: loop until allocations complete.
    // We can loop at most r + c - 1 times usually.

    let itr = 0;
    const maxItr = r * c + 10; // safety break

    while (Math.max(...supplyLeft) > 0 && Math.max(...demandLeft) > 0 && itr < maxItr) {
      itr++;
      let minCost = Infinity;
      let minI = -1;
      let minJ = -1;

      for (let i = 0; i < r; i++) {
        if (supplyLeft[i] <= 0) continue;
        for (let j = 0; j < c; j++) {
          if (demandLeft[j] <= 0 || (supplyLeft[i] === 0 && demandLeft[j] === 0)) continue;
          // Note: Logic above is slightly tricky for degeneracy.
          // Standard LCM searches all valid (i, j) where supply > 0 and demand > 0
          if (currentCosts[i][j] < minCost) {
            minCost = currentCosts[i][j];
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

      // We don't strictly need 'used' matrix if we check supply/demand > 0
    }

    const totalCost = alloc.reduce(
      (sum, row) => sum + row.reduce((s, cell) => s + cell.alloc * cell.cost, 0),
      0
    );

    return { allocations: alloc, totalCost, method: "least" };
  };

  // --- Vogel's Approximation Method (VAM) ---
  const solveVogel = (sup: number[], dem: number[], currentCosts: number[][]): TPResult => {
    const r = sup.length;
    const c = dem.length;
    const supplyLeft = [...sup];
    const demandLeft = [...dem];
    const alloc = initAllocMatrix(r, c, currentCosts);

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
          rowCosts.push(currentCosts[i][j]);
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
          colCosts.push(currentCosts[i][j]);
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

    let remainingFlow = sup.reduce((a, b) => a + b, 0);

    while (remainingFlow > 0) {
      const { rowPen, colPen } = getPenalties();

      // find maximum penalty
      let maxPen = -1;
      let isRow = true;
      let idx = -1;

      // Check rows
      for (let i = 0; i < r; i++) {
        if (rowPen[i] > maxPen) {
          maxPen = rowPen[i];
          isRow = true;
          idx = i;
        }
      }
      // Check cols - prioritize finding *some* penalty
      for (let j = 0; j < c; j++) {
        if (colPen[j] > maxPen) { // strict greater or equal? 
          // usually if equal, arbitrary. 
          maxPen = colPen[j];
          isRow = false;
          idx = j;
        }
      }

      if (idx === -1) {
        // Fallback if no penalties found (e.g. only 1 row/col left)
        // Just fill using LCM or random valid
        let found = false;
        for (let i = 0; i < r; i++) {
          if (supplyLeft[i] > 0) {
            for (let j = 0; j < c; j++) {
              if (demandLeft[j] > 0) {
                const x = Math.min(supplyLeft[i], demandLeft[j]);
                alloc[i][j].alloc = x;
                supplyLeft[i] -= x;
                demandLeft[j] -= x;
                remainingFlow -= x;
                found = true;
                break; // simplify loop
              }
            }
          }
        }
        if (!found) break; // Should not happen if flow remains
        continue;
      }

      // choose min cost cell in that row / col
      let selI = -1;
      let selJ = -1;
      let minCost = BIG;

      if (isRow) {
        const i = idx;
        for (let j = 0; j < c; j++) {
          if (!activeCol[j] || demandLeft[j] <= 0) continue;
          if (currentCosts[i][j] < minCost) {
            minCost = currentCosts[i][j];
            selI = i;
            selJ = j;
          }
        }
      } else {
        const j = idx;
        for (let i = 0; i < r; i++) {
          if (!activeRow[i] || supplyLeft[i] <= 0) continue;
          if (currentCosts[i][j] < minCost) {
            minCost = currentCosts[i][j];
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
      remainingFlow -= x;

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
    let workingSupply = [...supply];
    let workingDemand = [...demand];
    let workingCosts = costs.map(row => [...row]); // Deep copy of structure

    // Balance check
    const totalSup = workingSupply.reduce((a, b) => a + b, 0);
    const totalDem = workingDemand.reduce((a, b) => a + b, 0);
    let balancedMsg = "";

    if (Math.abs(totalSup - totalDem) > 1e-6) {
      if (totalSup > totalDem) {
        // Excess supply -> Add dummy destination (column)
        const diff = totalSup - totalDem;
        workingDemand.push(diff);
        // Add 0 cost to each row for the new column
        workingCosts.forEach(row => row.push(0));
        balancedMsg = `Unbalanced (Supply > Demand). Added Dummy Destination with demand ${diff}.`;
      } else {
        // Excess demand -> Add dummy source (row)
        const diff = totalDem - totalSup;
        workingSupply.push(diff);
        // Add new row of 0s
        const width = workingCosts[0].length;
        workingCosts.push(Array(width).fill(0));
        balancedMsg = `Unbalanced (Demand > Supply). Added Dummy Source with supply ${diff}.`;
      }
    }

    let res: TPResult;
    if (method === "nw") res = solveNWCorner(workingSupply, workingDemand, workingCosts);
    else if (method === "least") res = solveLeastCost(workingSupply, workingDemand, workingCosts);
    else res = solveVogel(workingSupply, workingDemand, workingCosts);

    if (balancedMsg) {
      res.message = balancedMsg;
      res.isBalanced = false;
    } else {
      res.isBalanced = true;
    }

    setResult(res);
  };

  // ---------- UI ----------

  const methodLabel = (m: Method) =>
    m === "nw" ? "North-West Corner" : m === "least" ? "Least Cost" : "Vogel’s Approx.";

  const hasResult = result && result.allocations.length > 0;

  // Render helpers for result table
  const resRows = result ? result.allocations.length : 0;
  const resCols = result && result.allocations.length > 0 ? result.allocations[0].length : 0;

  const getColLabel = (j: number) => {
    // If we added a column and this is the last one (and it wasn't there before), it's Dummy
    // simple logic: if original cols < resCols and j >= cols -> Dummy
    if (result && !result.isBalanced && result.allocations[0].length > cols) {
      if (j >= cols) return "Dummy";
    }
    return `D${j + 1}`;
  };

  const getRowLabel = (i: number) => {
    if (result && !result.isBalanced && result.allocations.length > rows) {
      if (i >= rows) return "Dummy";
    }
    return `S${i + 1}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">
          Transportation Problem Solver
        </h2>
        <p className="text-xs text-slate-500">
          Supports unbalanced problems (auto-balancing) using North-West Corner,
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
        <div className="inline-block min-w-[320px] rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-card">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-muted">
              <tr>
                <th className="p-2 text-left text-slate-500 font-medium">Source</th>
                {Array.from({ length: cols }).map((_, j) => (
                  <th key={j} className="p-2 text-center text-slate-500 font-medium">
                    D{j + 1}
                  </th>
                ))}
                <th className="p-2 text-center text-slate-500 font-medium">Supply</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1 font-medium text-slate-600 dark:text-slate-300">
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
                      className="w-20 mx-auto bg-slate-50 dark:bg-slate-900 font-semibold"
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
              <tr className="border-t bg-slate-50 dark:bg-muted">
                <td className="px-2 py-1 font-medium text-slate-600 dark:text-slate-300">
                  Demand
                </td>
                {Array.from({ length: cols }).map((_, j) => (
                  <td key={j} className="px-2 py-1">
                    <Input
                      className="w-20 mx-auto bg-slate-50 dark:bg-slate-900 font-semibold"
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
              className={`px-3 py-1 rounded-full border text-xs sm:text-sm transition-colors ${method === m
                  ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                  : "bg-background text-foreground border-border hover:bg-slate-100 dark:hover:bg-slate-800"
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
        <div className="space-y-4 text-xs sm:text-sm bg-muted/30 p-4 rounded-xl border border-border">
          <div className="space-y-1">
            {result.message && (
              <div className="p-2 mb-2 rounded bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-100 dark:border-amber-800/50">
                <span className="font-semibold block">⚠️ Balancing Applied</span>
                {result.message}
              </div>
            )}
            {hasResult && (
              <div className="flex items-baseline justify-between">
                <p>Method: <span className="font-semibold">{methodLabel(result.method)}</span></p>
                <p className="text-lg">Total Cost: <span className="font-bold text-sky-600 dark:text-sky-400">{result.totalCost.toFixed(2)}</span></p>
              </div>
            )}
          </div>

          {hasResult && (
            <div className="w-full overflow-x-auto">
              <div className="inline-block min-w-[320px] rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-card">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-muted">
                    <tr>
                      <th className="p-2 text-left text-slate-500 dark:text-slate-400">Source</th>
                      {Array.from({ length: resCols }).map((_, j) => (
                        <th
                          key={j}
                          className={`p-2 text-center font-medium ${getColLabel(j) === "Dummy" ? "text-amber-600" : "text-slate-500 dark:text-slate-400"}`}
                        >
                          {getColLabel(j)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.allocations.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className={`px-2 py-1 font-medium ${getRowLabel(i) === "Dummy" ? "text-amber-600" : "text-slate-600 dark:text-slate-300"}`}>
                          {getRowLabel(i)}
                        </td>
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className={`px-2 py-2 text-center align-middle transition-colors ${cell.alloc > 0
                                ? "bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/30"
                                : ""
                              }`}
                          >
                            <div className="flex flex-col items-center justify-center gap-0.5 min-h-[40px]">
                              {cell.alloc > 0 && (
                                <span className="text-sm font-bold text-sky-700 dark:text-sky-300">
                                  {cell.alloc}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                ({cell.cost})
                              </span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransportationSolver;
