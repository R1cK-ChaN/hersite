import { Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/stores/projectStore";
import { useUIStore } from "@/stores/uiStore";
import { PublishConfirmDialog } from "./PublishConfirmDialog";

export function PublishButton() {
  const project = useProjectStore((s) => s.project);
  const deployStatus = useProjectStore((s) => s.deployStatus);
  const setPublishDialogOpen = useUIStore((s) => s.setPublishDialogOpen);

  const isDeploying = deployStatus === "deploying";
  const hasChanges = project?.hasUnpublishedChanges ?? false;

  return (
    <>
      <Button
        onClick={() => setPublishDialogOpen(true)}
        disabled={isDeploying || !hasChanges}
        className="gap-2"
        size="sm"
      >
        {isDeploying ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Rocket className="h-4 w-4" />
        )}
        {isDeploying ? "Publishing..." : "Publish"}
      </Button>
      <PublishConfirmDialog />
    </>
  );
}
