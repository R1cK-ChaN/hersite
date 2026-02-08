import { useState, useCallback } from "react";
import { Header } from "./Header";
import { StatusBar } from "./StatusBar";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { PreviewPanel } from "@/components/preview/PreviewPanel";

export function AppShell() {
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(320, Math.min(600, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div
          className="flex-shrink-0 overflow-hidden"
          style={{ width: sidebarWidth }}
        >
          <ChatSidebar />
        </div>

        {/* Resize handle */}
        <div
          className={`w-1 cursor-col-resize hover:bg-primary/30 transition-colors flex-shrink-0 ${
            isDragging ? "bg-primary/30" : "bg-border"
          }`}
          onMouseDown={handleMouseDown}
        />

        <div className="flex-1 overflow-hidden">
          <PreviewPanel />
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
