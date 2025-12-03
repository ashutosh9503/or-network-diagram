import { useEffect, useMemo, useRef, useState } from "react";
import { Activity } from "@/types/activity";
import { ActivityForm } from "@/components/ActivityForm";
import { ActivityTable } from "@/components/ActivityTable";
import { NetworkDiagram } from "@/components/NetworkDiagram";
import { AnalysisTable } from "@/components/AnalysisTable";
import LppSolver from "@/components/ui/LppSolver";
import TransportationSolver from "@/components/TransportationSolver";
import { calculateNetworkAnalysis } from "@/utils/networkCalculations";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as htmlToImage from "html-to-image";
import { motion } from "framer-motion";
import { Network, Trash2, Download } from "lucide-react";

const SAMPLE_DATA: Activity[] = [
  { id: "A", duration: 3, predecessors: [] },
  { id: "B", duration: 4, predecessors: [] },
  { id: "C", duration: 2, predecessors: ["A"] },
  { id: "D", duration: 5, predecessors: ["A"] },
  { id: "E", duration: 3, predecessors: ["B", "C"] },
  { id: "F", duration: 2, predecessors: ["D", "E"] },
];

const Index = () => {
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem("activities");
    return saved ? JSON.parse(saved) : [];
  });

  const [showDiagram, setShowDiagram] = useState(false);

  const diagramRef = useRef<HTMLDivElement | null>(null);
  const analysisRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem("activities", JSON.stringify(activities));
  }, [activities]);

  const calculatedActivities = useMemo(
    () => calculateNetworkAnalysis(activities),
    [activities]
  );

  const criticalPath = useMemo(
    () =>
      calculatedActivities
        .filter((a) => a.isCritical)
        .map((a) => a.id)
        .join(" → "),
    [calculatedActivities]
  );

  const projectDuration = useMemo(
    () => Math.max(...calculatedActivities.map((a) => a.ef), 0),
    [calculatedActivities]
  );

  const scrollToSection = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ---------- Handlers ----------

  const handleAddActivity = (activity: Activity) => {
    setActivities((prev) => [...prev, activity]);
    setShowDiagram(false);
  };

  const handleDeleteActivity = (id: string) => {
    const confirmDelete = confirm(
      `Are you sure you want to delete activity ${id}?`
    );
    if (!confirmDelete) return;

    const dependents = activities.filter((a) => a.predecessors.includes(id));
    if (dependents.length > 0) {
      toast.error(
        `Cannot delete ${id}: activities ${dependents
          .map((a) => a.id)
          .join(", ")} depend on it`
      );
      return;
    }

    setActivities((prev) => prev.filter((a) => a.id !== id));
    setShowDiagram(false);
    toast.success(`Activity ${id} deleted`);
  };

  const handleGenerateDiagram = () => {
    if (activities.length === 0) {
      toast.error("Please add at least one activity first");
      return;
    }
    setShowDiagram(true);
    toast.success("Network diagram generated");
  };

  const handleLoadSampleProject = () => {
    setActivities(SAMPLE_DATA);
    setShowDiagram(true);
    toast.success("Sample project loaded");
  };

  const handleClearAll = () => {
    const ok = confirm("Clear all activities?");
    if (!ok) return;
    setActivities([]);
    setShowDiagram(false);
    toast.success("All activities cleared");
  };

  const handleExportDiagram = async () => {
    if (!diagramRef.current) {
      toast.error("No diagram to export yet");
      return;
    }

    try {
      const dataUrl = await htmlToImage.toPng(diagramRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "network-diagram.png";
      link.click();
    } catch (error) {
      console.error(error);
      toast.error("Failed to export diagram");
    }
  };

  const handleExportAnalysis = async () => {
    if (!analysisRef.current) {
      toast.error("No analysis to export yet");
      return;
    }

    try {
      const pixelRatio = Math.min(4, (window.devicePixelRatio || 1) * 2);

      const dataUrl = await htmlToImage.toPng(analysisRef.current, {
        pixelRatio,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "critical-path-analysis.png";
      link.click();
    } catch (error) {
      console.error(error);
      toast.error("Failed to export analysis");
    }
  };

  // ---------- UI ----------

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* NAVBAR */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo + title */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white shadow">
              OR
            </div>
            <div className="leading-tight">
              <h1 className="text-sm sm:text-base font-semibold">
                OR Network & Optimization Studio
              </h1>
              <p className="text-xs text-slate-500">
                CPM • PERT • LPP • Transportation Solver
              </p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600">
            <button
              onClick={() => scrollToSection("hero")}
              className="px-3 py-1 rounded-full hover:bg-slate-100"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("activities-section")}
              className="px-3 py-1 rounded-full hover:bg-slate-100"
            >
              Activities
            </button>
            <button
              onClick={() => scrollToSection("network-section")}
              className="px-3 py-1 rounded-full hover:bg-slate-100"
            >
              Network
            </button>
            <button
              onClick={() => scrollToSection("lpp-section")}
              className="px-3 py-1 rounded-full hover:bg-slate-100"
            >
              LPP
            </button>
            <button
              onClick={() => scrollToSection("transportation-section")}
              className="px-3 py-1 rounded-full hover:bg-slate-100"
            >
              Transportation
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-16">
          {/* HERO SECTION */}
          <motion.section
            id="hero"
            className="rounded-3xl bg-white shadow-sm border border-slate-200 px-6 py-8 sm:px-8 sm:py-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600 mb-3 text-center">
              Operations Research Toolkit
            </p>
            <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              Visualize CPM / PERT Networks &amp; Solve LPP &amp; Transportation
            </h2>
            <p className="mt-3 text-center text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto">
              Designed for BSc IT (NEP) students and faculty: add activities,
              generate network diagrams, compute critical paths, plot LPP
              feasible regions and solve transportation problems using
              classical OR methods.
            </p>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="px-7 bg-sky-600 hover:bg-sky-700 text-white shadow-md"
                  onClick={() => scrollToSection("activities-section")}
                >
                  Start with CPM / PERT
                </Button>
              </motion.div>
              <Button
                size="lg"
                variant="outline"
                className="border-sky-300 text-sky-700 bg-white hover:bg-sky-50"
                onClick={() => scrollToSection("lpp-section")}
              >
                Try LPP Graph Solver
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-slate-600"
                onClick={handleLoadSampleProject}
              >
                Load Sample Project
              </Button>
            </div>
          </motion.section>

          {/* ACTIVITIES + SUMMARY SECTION */}
          <motion.section
            id="activities-section"
            className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] scroll-mt-24"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4 }}
          >
            {/* Left: Activities & Form */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2">
                  <Network className="h-5 w-5 text-sky-600" />
                  Project Activities (CPM / PERT)
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Define activities, durations, and precedence relationships.
                  These will be used to generate the network diagram and
                  compute early/late times.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-3">
                  Add New Activity
                </h3>
                <ActivityForm
                  onAddActivity={handleAddActivity}
                  existingIds={activities.map((a) => a.id)}
                />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Activity List</h3>
                  {activities.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAll}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Clear All
                    </Button>
                  )}
                </div>
                <ActivityTable
                  activities={activities}
                  onDeleteActivity={handleDeleteActivity}
                />
              </div>
            </div>

            {/* Right: Summary & Actions */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold">Project Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500 mb-1">
                      Total Activities
                    </p>
                    <p className="text-2xl font-bold">{activities.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500 mb-1">
                      Project Duration
                    </p>
                    <p className="text-2xl font-bold text-sky-600">
                      {projectDuration || 0} days
                    </p>
                  </div>
                </div>
              </div>

              {showDiagram && criticalPath && (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-rose-700 mb-1">
                    Critical Path
                  </h3>
                  <p className="text-base font-mono font-bold text-rose-800">
                    {criticalPath}
                  </p>
                  <p className="mt-1 text-[11px] text-rose-700/80">
                    {
                      calculatedActivities.filter((a) => a.isCritical)
                        .length
                    }{" "}
                    critical activities
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleGenerateDiagram}
                  disabled={activities.length === 0}
                  className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-md"
                >
                  🚀 Generate Network Diagram
                </Button>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={handleExportDiagram}
                    disabled={!showDiagram || activities.length === 0}
                    className="h-11 w-full border-sky-500 text-sky-600 hover:bg-sky-50 text-sm font-semibold"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Diagram (PNG)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportAnalysis}
                    disabled={!showDiagram || activities.length === 0}
                    className="h-11 w-full border-violet-500 text-violet-600 hover:bg-violet-50 text-sm font-semibold"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Critical Path Table (PNG)
                  </Button>
                </div>
              </div>
            </div>
          </motion.section>

          {/* NETWORK + ANALYSIS SECTION */}
          {showDiagram && activities.length > 0 && (
            <motion.section
              id="network-section"
              className="space-y-10 scroll-mt-24"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4 }}
            >
              <div ref={diagramRef} className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold">
                  Network Diagram
                </h2>
                <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                  <NetworkDiagram activities={activities} />
                </div>
              </div>

              <div
                ref={analysisRef}
                className="flex justify-center px-2 sm:px-4"
              >
                <div className="w-full max-w-4xl rounded-3xl bg-white shadow-lg border border-slate-200 p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">
                    Critical Path Analysis
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 text-center mb-4">
                    Earliest and latest event times, slack, and critical
                    activities. Critical path rows are highlighted.
                  </p>
                  <AnalysisTable activities={calculatedActivities} />
                </div>
              </div>
            </motion.section>
          )}

          {/* LPP SECTION */}
          <motion.section
            id="lpp-section"
            className="space-y-4 scroll-mt-24"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Linear Programming (LPP) – Graphical Method
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Solve 2-variable LPP problems using graphical method. Supports
              Max/Min objective, ≤ / ≥ / = constraints, plots the feasible
              region and highlights the optimal corner point.
            </p>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <LppSolver />
            </div>
          </motion.section>

          {/* TRANSPORTATION SECTION */}
          <motion.section
            id="transportation-section"
            className="space-y-4 scroll-mt-24 mb-10"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Transportation Problem – Initial Solution Methods
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Balanced transportation minimization problems using North-West
              Corner, Least Cost and Vogel&apos;s Approximation methods.
              Shows allocation table and total transportation cost.
            </p>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <TransportationSolver />
            </div>
          </motion.section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-5">
        <div className="mx-auto max-w-6xl px-4 text-center text-[11px] text-slate-500">
          OR Network & Optimization Studio · Built for BSc IT OR lab &
          project work
        </div>
      </footer>
    </div>
  );
};

export default Index;
