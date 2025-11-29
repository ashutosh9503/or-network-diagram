import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ActivityWithCalculations } from "@/types/activity";

interface AnalysisTableProps {
  activities: ActivityWithCalculations[];
}

export const AnalysisTable = ({ activities }: AnalysisTableProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold">Network Analysis Results</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Critical path activities are highlighted in red
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Activity</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>ES</TableHead>
            <TableHead>EF</TableHead>
            <TableHead>LS</TableHead>
            <TableHead>LF</TableHead>
            <TableHead>Slack</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <TableRow
              key={activity.id}
              className={
                activity.isCritical ? "bg-critical-light" : ""
              }
            >
              <TableCell className="font-semibold">{activity.id}</TableCell>
              <TableCell>{activity.duration}</TableCell>
              <TableCell>{activity.es}</TableCell>
              <TableCell>{activity.ef}</TableCell>
              <TableCell>{activity.ls}</TableCell>
              <TableCell>{activity.lf}</TableCell>
              <TableCell>
                <span
                  className={`font-semibold ${
                    activity.slack === 0 ? "text-critical" : "text-success"
                  }`}
                >
                  {activity.slack}
                </span>
              </TableCell>
              <TableCell>
                {activity.isCritical ? (
                  <Badge variant="destructive">Critical</Badge>
                ) : (
                  <Badge variant="secondary">Non-Critical</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
