import { useProjectStore } from "@/stores/projectStore";
import { useUIStore } from "@/stores/uiStore";
import { ExternalLink, Wifi, WifiOff } from "lucide-react";
import { DeployStatusBadge } from "@/components/publish/DeployStatusBadge";

export function StatusBar() {
  const project = useProjectStore((s) => s.project);
  const isConnected = useUIStore((s) => s.isConnected);

  return (
    <footer className="flex items-center justify-between px-4 h-8 border-t bg-card text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {isConnected ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          <span>{isConnected ? "Connected" : "Disconnected"}</span>
        </div>
        <DeployStatusBadge />
      </div>

      <div className="flex items-center gap-3">
        {project?.siteUrl && (
          <a
            href={project.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            {project.siteUrl}
          </a>
        )}
      </div>
    </footer>
  );
}
