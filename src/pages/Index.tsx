import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ActivityForm } from "@/components/ActivityForm";
import { ActivityTable } from "@/components/ActivityTable";
import { NetworkDiagram } from "@/components/NetworkDiagram";
import { AnalysisTable } from "@/components/AnalysisTable";
import { Activity } from "@/types/activity";
import { calculateNetworkAnalysis } from "@/utils/networkCalculations";
import { toast } from "sonner";
import { Network, Trash2 } from "lucide-react";
import * as htmlToImage from "html-to-image";
import { motion } from "framer-motion";
import LppSolver from "@/components/ui/LppSolver";

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

  const handleLoadSampleProject = () => {
    setActivities(SAMPLE_DATA);
    setShowDiagram(true);
    toast.success("Sample project loaded");
  };

  const handleClearAll = () => {
    setActivities([]);
    setShowDiagram(false);
    toast.success("All activities cleared");
  };

  const handleGenerateDiagram = () => {
    if (activities.length === 0) {
      toast.error("Please add at least one activity");
      return;
    }
    setShowDiagram(true);
    toast.success("Network diagram generated!");
  };

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* NAVBAR */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          {/* Logo + title */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white shadow">
              OR
            </div>
            <div>
              <h1 className="text-lg font-semibold">
                OR Network Diagram Generator
              </h1>
              <p className="text-xs text-slate-500">
                CPM • PERT • LPP • Transportation (coming soon)
              </p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden gap-3 text-sm font-medium text-slate-600 sm:flex">
            <button
              className="rounded-full px-3 py-1 hover:bg-slate-100"
              onClick={() => scrollToSection("activities-section")}
            >
              Activities
            </button>
            <button
              className="rounded-full px-3 py-1 hover:bg-slate-100"
              onClick={() => scrollToSection("network-section")}
            >
              Network Diagram
            </button>
            <button
              className="rounded-full px-3 py-1 hover:bg-slate-100"
              onClick={() => scrollToSection("lpp-section")}
            >
              LPP Solver
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto px-4 py-10 space-y-16">
        {/* HERO */}
        <motion.section
          id="hero"
          className="rounded-3xl bg-white px-6 py-10 shadow-sm border border-slate-200"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-center text-3xl sm:text-4xl font-bold tracking-tight">
            Operations Research{" "}
            <span className="text-sky-600">Network Diagram</span> Generator
          </h2>
          <p className="mt-3 text-center text-sm text-slate-600 max-w-2xl mx-auto">
            Enter activities and durations to automatically build the project
            network, compute the critical path, and visualize LPP problems with
            graphs – perfect for BSc IT OR labs.
          </p>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                className="bg-sky-600 hover:bg-sky-700 text-white px-8 shadow-md"
                onClick={() => scrollToSection("activities-section")}
              >
                Start Building Network
              </Button>
            </motion.div>

            <Button
              size="lg"
              variant="outline"
              className="border-sky-300 text-sky-700 bg-white hover:bg-sky-50"
              onClick={handleLoadSampleProject}
            >
              Load Example Project
            </Button>

            <Button
              size="lg"
              variant="ghost"
              className="text-slate-600"
              onClick={() => scrollToSection("lpp-section")}
            >
              Go to LPP Solver
            </Button>
          </div>
        </motion.section>

        {/* ACTIVITIES + SUMMARY */}
        <motion.section
          id="activities-section"
          className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4 }}
        >
          {/* Left column – input + activity list */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Network className="h-5 w-5 text-sky-600" />
                Project Activities
              </h2>
              <ActivityForm
                onAddActivity={handleAddActivity}
                existingIds={activities.map((a) => a.id)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Activity List</h3>
                {activities.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
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

          {/* Right column – project summary + actions */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Project Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs text-slate-500 mb-1">
                    Total Activities
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {activities.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs text-slate-500 mb-1">
                    Project Duration
                  </p>
                  <p className="text-3xl font-bold text-sky-600">
                    {projectDuration || 0} days
                  </p>
                </div>
              </div>
            </div>

            {showDiagram && criticalPath && (
              <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-rose-700 mb-1">
                  Critical Path
                </h3>
                <p className="text-xl font-mono font-bold">{criticalPath}</p>
                <p className="mt-1 text-xs text-rose-700/80">
                  {calculatedActivities.filter((a) => a.isCritical).length}{" "}
                  critical activities
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleGenerateDiagram}
                disabled={activities.length === 0}
                className="h-12 w-full bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-md"
              >
                🚀 Generate Network Diagram
              </Button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={handleExportDiagram}
                  disabled={!showDiagram || activities.length === 0}
                  className="h-12 w-full border-sky-500 text-sky-600 hover:bg-sky-50 text-sm font-semibold"
                >
                  📥 Download Diagram (PNG)
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportAnalysis}
                  disabled={!showDiagram || activities.length === 0}
                  className="h-12 w-full border-violet-500 text-violet-600 hover:bg-violet-50 text-sm font-semibold"
                >
                  📊 Download Analysis (PNG)
                </Button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* NETWORK + CRITICAL PATH SECTION */}
        {showDiagram && activities.length > 0 && (
          <motion.section
            id="network-section"
            className="space-y-10"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4 }}
          >
            <div ref={diagramRef} className="space-y-4">
              <h2 className="text-2xl font-bold">Network Diagram</h2>
              <NetworkDiagram activities={activities} />
            </div>

            <div
              ref={analysisRef}
              className="flex justify-center px-2 sm:px-4"
            >
              <div className="w-full max-w-4xl rounded-3xl bg-white shadow-lg border border-slate-200 p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
                  Critical Path Analysis
                </h2>
                <p className="text-sm text-slate-600 text-center mb-4">
                  Network analysis results. Critical path activities are
                  highlighted in red.
                </p>
                <AnalysisTable activities={calculatedActivities} />
              </div>
            </div>
          </motion.section>
        )}

        {/* LPP SECTION */}
        <motion.section
          id="lpp-section"
          className="space-y-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-bold tracking-tight">
            Linear Programming (LPP) – Graphical Solver
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            Solve 2-variable maximization problems using the graphical method.
            The solver plots all constraints, shades the feasible region, marks
            corner points, and shows the optimal solution value.
          </p>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <LppSolver />
          </div>
        </motion.section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-10">
        <div className="container mx-auto px-4 text-center text-xs text-slate-500">
          Built for Operations Research students and engineers · OR Diagram
          Studio
        </div>
      </footer>
    </div>
  );
};

export default Index;
