import { Handle, Position } from "reactflow";
import { Card } from "@/components/ui/card";

interface ActivityNodeProps {
  data: {
    label: string;
    duration: number;
    es: number;
    ef: number;
    ls: number;
    lf: number;
    slack: number;
    isCritical: boolean;
  };
}

export const ActivityNode = ({ data }: ActivityNodeProps) => {
  return (
    <>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Card
        className={`p-4 min-w-[180px] transition-all duration-200 ${
          data.isCritical
            ? "border-critical border-2 shadow-lg bg-critical-light"
            : "border-border shadow-md hover:shadow-lg"
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">{data.label}</h3>
            {data.isCritical && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-critical text-white rounded">
                CRITICAL
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ES:</span>
                <span className="font-semibold">{data.es}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">EF:</span>
                <span className="font-semibold">{data.ef}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">LS:</span>
                <span className="font-semibold">{data.ls}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">LF:</span>
                <span className="font-semibold">{data.lf}</span>
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Duration:</span>
              <span className="font-bold text-sm">{data.duration}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Slack:</span>
              <span
                className={`font-bold text-sm ${
                  data.slack === 0 ? "text-critical" : "text-success"
                }`}
              >
                {data.slack}
              </span>
            </div>
          </div>
        </div>
      </Card>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </>
  );
};
