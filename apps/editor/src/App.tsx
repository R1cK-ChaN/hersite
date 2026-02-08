import { useSocket } from "@/hooks/useSocket";
import { useProjectStore } from "@/stores/projectStore";
import { AppShell } from "@/components/layout/AppShell";
import { SetupWizard } from "@/components/wizard/SetupWizard";
import { Toaster } from "sonner";

export default function App() {
  useSocket();
  const project = useProjectStore((s) => s.project);

  return (
    <>
      {project ? <AppShell /> : <SetupWizard />}
      <Toaster position="bottom-right" richColors />
    </>
  );
}
