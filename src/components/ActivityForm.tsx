import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Activity } from "@/types/activity";

interface ActivityFormProps {
  onAddActivity: (activity: Activity) => void;
  existingIds: string[];
}

export const ActivityForm = ({
  onAddActivity,
  existingIds,
}: ActivityFormProps) => {
  const [activityId, setActivityId] = useState("");
  const [duration, setDuration] = useState("");
  const [predecessors, setPredecessors] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activityId.trim()) {
      toast.error("Please enter an activity ID");
      return;
    }

    if (!duration || parseFloat(duration) <= 0) {
      toast.error("Please enter a valid duration greater than 0");
      return;
    }

    if (existingIds.includes(activityId.trim().toUpperCase())) {
      toast.error("Activity ID already exists");
      return;
    }

    const predList = predecessors
      .split(",")
      .map((p) => p.trim().toUpperCase())
      .filter((p) => p !== "");

    // Validate predecessors exist
    const invalidPreds = predList.filter((p) => !existingIds.includes(p));
    if (invalidPreds.length > 0) {
      toast.error(`Invalid predecessor(s): ${invalidPreds.join(", ")}`);
      return;
    }

    const newActivity: Activity = {
      id: activityId.trim().toUpperCase(),
      duration: parseFloat(duration),
      predecessors: predList,
    };

    onAddActivity(newActivity);
    toast.success(`Activity ${newActivity.id} added successfully`);

    // Reset form
    setActivityId("");
    setDuration("");
    setPredecessors("");
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Add New Activity</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="activityId">Activity ID</Label>
          <Input
            id="activityId"
            placeholder="e.g., A, B, C"
            value={activityId}
            onChange={(e) => setActivityId(e.target.value)}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (days)</Label>
          <Input
            id="duration"
            type="number"
            min="0.1"
            step="0.1"
            placeholder="e.g., 5"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="predecessors">Predecessors (comma-separated)</Label>
          <Input
            id="predecessors"
            placeholder="e.g., A, B (leave empty if none)"
            value={predecessors}
            onChange={(e) => setPredecessors(e.target.value)}
            className="bg-background"
          />
        </div>

        <Button type="submit" className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Activity
        </Button>
      </form>
    </Card>
  );
};
