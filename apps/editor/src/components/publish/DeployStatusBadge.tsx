import { useProjectStore } from "@/stores/projectStore";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, AlertCircle, Circle } from "lucide-react";

export function DeployStatusBadge() {
  const deployStatus = useProjectStore((s) => s.deployStatus);

  switch (deployStatus) {
    case "deploying":
      return (
        <Badge variant="secondary" className="gap-1 text-xs">
          <Loader2 className="w-3 h-3 animate-spin" />
          Deploying
        </Badge>
      );
    case "deployed":
      return (
        <Badge variant="secondary" className="gap-1 text-xs text-green-600">
          <CheckCircle className="w-3 h-3" />
          Live
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="secondary" className="gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1 text-xs">
          <Circle className="w-3 h-3" />
          Draft
        </Badge>
      );
  }
}
