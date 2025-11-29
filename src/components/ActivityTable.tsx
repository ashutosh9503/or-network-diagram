import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { Activity } from "@/types/activity";

interface ActivityTableProps {
  activities: Activity[];
  onDeleteActivity: (id: string) => void;
}

export const ActivityTable = ({
  activities,
  onDeleteActivity,
}: ActivityTableProps) => {
  if (activities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          No activities added yet. Start by adding your first activity.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Activity ID</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Predecessors</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell className="font-semibold">{activity.id}</TableCell>
              <TableCell>{activity.duration} days</TableCell>
              <TableCell>
                {activity.predecessors.length > 0
                  ? activity.predecessors.join(", ")
                  : "None"}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteActivity(activity.id)}
                  className="hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
