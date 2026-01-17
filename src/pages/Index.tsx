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
import { Download, Plus, ListTodo, Activity as ActivityIcon, Kanban, Calculator, Truck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const [activeTab, setActiveTab] = useState("activities");

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

  // ---------- Handlers ----------

  const handleAddActivity = (activity: Activity) => {
    setActivities((prev) => [...prev, activity]);
    toast.success("Activity Added");
  };

  const handleDeleteActivity = (id: string) => {
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
    toast.success(`Activity ${id} deleted`);
  };

  const handleLoadSampleProject = () => {
    setActivities(SAMPLE_DATA);
    toast.success("Sample project loaded");
    setActiveTab("summary");
  };

  const handleClearAll = () => {
    if (confirm("Clear all activities?")) {
      setActivities([]);
      toast.success("All activities cleared");
    }
  };

  const handleExportDiagram = async () => {
    if (!diagramRef.current) return;
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
      toast.success("Diagram exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export diagram");
    }
  };

  const handleExportAnalysis = async () => {
    if (!analysisRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(analysisRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "critical-path-analysis.png";
      link.click();
      toast.success("Analysis table exported");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export analysis");
    }
  };

  return (
    <div className="w-full space-y-6">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Project Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage activities, analyze critical paths, and visualize networks.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleLoadSampleProject}>
            Load Sample
          </Button>
          {activities.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleClearAll}>
              Clear Data
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto p-1 bg-muted/50 rounded-xl mb-6">
          <TabsTrigger value="activities" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Activities Setup</span>
            <span className="sm:hidden">Confirm</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Kanban className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Project Summary</span>
            <span className="sm:hidden">Summary</span>
          </TabsTrigger>
          <TabsTrigger value="network" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ActivityIcon className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Network Diagram</span>
            <span className="sm:hidden">Network</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ListTodo className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Critical Path</span>
            <span className="sm:hidden">Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="extras" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Calculator className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Extra Tools</span>
            <span className="sm:hidden">Tools</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. Activities Setup */}
        <TabsContent value="activities" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Add Activity</CardTitle>
                <CardDescription>Define tasks and their dependencies</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityForm onAddActivity={handleAddActivity} existingIds={activities.map(a => a.id)} />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activity List</CardTitle>
                  <CardDescription>Manage your current project activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <ActivityTable activities={activities} onDeleteActivity={handleDeleteActivity} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 2. Project Summary */}
        <TabsContent value="summary" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                <ActivityIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activities.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Project Duration</CardTitle>
                <Kanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">{projectDuration} days</div>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Path</CardTitle>
                <Badge variant={criticalPath ? "destructive" : "secondary"}>
                  {calculatedActivities.filter(a => a.isCritical).length} Critical Steps
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-mono font-bold text-rose-600 dark:text-rose-400 truncate">
                  {criticalPath || "No path calculated"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder for empty state if needed */}
          {activities.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-muted/20">
              <ActivityIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold">No Activities Yet</h3>
              <p className="text-muted-foreground text-center max-w-sm mt-2">
                Go to the <strong>Activities Setup</strong> tab to start building your project network.
              </p>
              <Button variant="link" onClick={() => setActiveTab("activities")} className="mt-4">
                Create Entry
              </Button>
            </div>
          )}
        </TabsContent>


        {/* 3. Network Diagram */}
        <TabsContent value="network" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          {activities.length > 0 ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Network Diagram</CardTitle>
                  <CardDescription>Interactive visualization of the project network</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportDiagram}>
                  <Download className="mr-2 h-4 w-4" />
                  Export PNG
                </Button>
              </CardHeader>
              <CardContent>
                <div ref={diagramRef} className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden h-[600px]">
                  <NetworkDiagram activities={activities} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-20 text-muted-foreground">Add activities to view diagram</div>
          )}
        </TabsContent>

        {/* 4. Critical Path Analysis */}
        <TabsContent value="analysis" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          {activities.length > 0 ? (
            <div className="grid justify-items-center">
              <Card className="w-full max-w-5xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Critical Path Analysis</CardTitle>
                    <CardDescription>Detailed calculations for ES, EF, LS, LF, and Slack</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportAnalysis}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Table
                  </Button>
                </CardHeader>
                <CardContent ref={analysisRef} className="bg-card">
                  <AnalysisTable activities={calculatedActivities} />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">Add activities to view analysis</div>
          )}
        </TabsContent>

        {/* 5. Extras (LPP & Transportation) */}
        <TabsContent value="extras" className="space-y-8 focus-visible:outline-none focus-visible:ring-0">

          <div className="grid gap-8 md:grid-cols-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-sky-500" />
                  LPP Solver
                </CardTitle>
                <CardDescription>Graphical method for 2-variable Linear Programming</CardDescription>
              </CardHeader>
              <CardContent>
                <LppSolver />
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-indigo-500" />
                  Transportation Solver
                </CardTitle>
                <CardDescription>North-West Corner, Least Cost, & Vogel's Approximation</CardDescription>
              </CardHeader>
              <CardContent>
                <TransportationSolver />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default Index;
