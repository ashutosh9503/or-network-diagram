import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ActivityForm } from "@/components/ActivityForm";
import { ActivityTable } from "@/components/ActivityTable";
import { NetworkDiagram } from "@/components/NetworkDiagram";
import { AnalysisTable } from "@/components/AnalysisTable";
import { Activity } from "@/types/activity";
import { calculateNetworkAnalysis } from "@/utils/networkCalculations";
import { toast } from "sonner";
import { Network, Trash2, FileDown, Database } from "lucide-react";
import html2canvas from "html2canvas";



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

  useEffect(() => {
    localStorage.setItem("activities", JSON.stringify(activities));
  }, [activities]);

  const [showDiagram, setShowDiagram] = useState(false);

  // ⭐ We add THIS! ⭐
  const diagramRef = useRef<HTMLDivElement | null>(null);

  const calculatedActivities = useMemo(
    () => calculateNetworkAnalysis(activities),
    [activities]
  );

  // ...


  const handleAddActivity = (activity: Activity) => {
    setActivities((prev) => [...prev, activity]);
    setShowDiagram(false);
  };

const handleDeleteActivity = (id: string) => {
  // 1) Ask for confirmation
  const confirmDelete = confirm(
    `Are you sure you want to delete activity ${id}?`
  );
  if (!confirmDelete) return;

  // 2) Check if any activity depends on this one
  const dependents = activities.filter((a) => a.predecessors.includes(id));
  if (dependents.length > 0) {
    toast.error(
      `Cannot delete ${id}: activities ${dependents
        .map((a) => a.id)
        .join(", ")} depend on it`
    );
    return;
  }

  // 3) Safe to delete
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
    const canvas = await html2canvas(diagramRef.current, {
      backgroundColor: "#ffffff", // nice clean white background
      scale: 2,                   // higher resolution
    });

    const dataUrl = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "or-network-diagram.png";
    link.click();

    toast.success("Diagram downloaded as PNG");
  } catch (err) {
    console.error(err);
    toast.error("Failed to export diagram");
  }
};



  const handleClearAll = () => {
    setActivities([]);
    setShowDiagram(false);
    toast.success("All activities cleared");
  };

  const handleLoadSample = () => {
    setActivities(SAMPLE_DATA);
    setShowDiagram(false);
    toast.success("Sample project loaded");
  };

  const handleGenerateDiagram = () => {
    if (activities.length === 0) {
      toast.error("Please add at least one activity");
      return;
    }
    setShowDiagram(true);
    toast.success("Network diagram generated!");
  };

  const criticalPath = useMemo(() => {
    return calculatedActivities
      .filter((a) => a.isCritical)
      .map((a) => a.id)
      .join(" → ");
  }, [calculatedActivities]);

  const projectDuration = useMemo(() => {
    return Math.max(...calculatedActivities.map((a) => a.ef), 0);
  }, [calculatedActivities]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Network className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                OR Network Diagram Generator
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Operations Research Network Diagram Generator
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Enter activities and durations to automatically create your network
            diagram and critical path analysis
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => document.getElementById("input-section")?.scrollIntoView({ behavior: "smooth" })}>
              Start Building Network
            </Button>
            <Button size="lg" variant="outline" onClick={handleLoadSample}>
              <Database className="mr-2 h-5 w-5" />
              Load Example Project
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8" id="input-section">
          {/* Left: Input Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Project Activities
              </h2>
              <ActivityForm
                onAddActivity={handleAddActivity}
                existingIds={activities.map((a) => a.id)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-foreground">
                  Activity List
                </h3>
                {activities.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
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

          {/* Right: Quick Stats */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Project Summary
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Activities
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {activities.length}
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground mb-1">
                    Project Duration
                  </p>
                  <p className="text-3xl font-bold text-accent">
                    {projectDuration || 0} days
                  </p>
                </div>
              </div>
            </div>

            {showDiagram && criticalPath && (
              <div className="bg-critical-light border-2 border-critical rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-critical mb-2">
                  Critical Path
                </h3>
                <p className="text-xl font-mono font-bold text-foreground">
                  {criticalPath}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {calculatedActivities.filter((a) => a.isCritical).length}{" "}
                  critical activities
                </p>
              </div>
            )}

         {/* Generate diagram */}
  <Button
    onClick={handleGenerateDiagram}
    disabled={activities.length === 0}
    className="w-full h-14 text-lg"
    size="lg"
  >
    <Network className="mr-2 h-5 w-5" />
    Generate Network Diagram
  </Button>

  {/* Download PNG */}
  <Button
    variant="outline"
    onClick={handleExportDiagram}
    disabled={!showDiagram || activities.length === 0}
    className="w-full h-14 text-lg"
    size="lg"
  >
    Download Diagram (PNG)
  </Button>
          </div>
        </div>

        {/* Diagram Section */}
        {showDiagram && activities.length > 0 && (
           <div className="mt-12 space-y-8" ref={diagramRef}>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Network Diagram
              </h2>
              <NetworkDiagram activities={activities} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Critical Path Analysis
              </h2>
              <AnalysisTable activities={calculatedActivities} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            Built for Operations Research students and engineers
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
