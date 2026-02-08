import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/uiStore";
import { useProjectStore } from "@/stores/projectStore";
import { getSocket } from "@/lib/socket";
import { Rocket } from "lucide-react";

export function PublishConfirmDialog() {
  const isOpen = useUIStore((s) => s.isPublishDialogOpen);
  const setOpen = useUIStore((s) => s.setPublishDialogOpen);
  const project = useProjectStore((s) => s.project);

  const handlePublish = () => {
    getSocket().emit("publish:confirm");
    setOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Publish Your Site
          </DialogTitle>
          <DialogDescription>
            This will build and deploy <strong>{project?.name}</strong> to the
            web. Your site will be live at a public URL.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handlePublish}>Publish Now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
