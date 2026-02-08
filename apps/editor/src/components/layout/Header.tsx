import { Monitor, Smartphone, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreviewStore } from "@/stores/previewStore";
import { PublishButton } from "@/components/publish/PublishButton";

export function Header() {
  const { deviceMode, setDeviceMode } = usePreviewStore();

  return (
    <header className="flex items-center justify-between px-4 h-14 border-b bg-card">
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-primary fill-primary" />
        <span className="font-semibold text-lg">HerSite</span>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex items-center bg-muted rounded-lg p-1">
          <Button
            variant={deviceMode === "desktop" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setDeviceMode("desktop")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={deviceMode === "mobile" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setDeviceMode("mobile")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <PublishButton />
    </header>
  );
}
