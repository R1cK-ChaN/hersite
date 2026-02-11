import { useSocket } from "@/hooks/useSocket";
import { useProjectStore } from "@/stores/projectStore";
import { useAuthStore } from "@/stores/authStore";
import { AppShell } from "@/components/layout/AppShell";
import { SetupWizard } from "@/components/wizard/SetupWizard";
import { AuthGate } from "@/components/auth/AuthGate";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";

export default function App() {
  useSocket();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAuthenticating = useAuthStore((s) => s.isAuthenticating);
  const project = useProjectStore((s) => s.project);

  // Show loading spinner while auto-validating persisted token
  if (isAuthenticating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show auth gate if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <AuthGate />
        <Toaster position="bottom-right" richColors />
      </>
    );
  }

  return (
    <>
      {project ? <AppShell /> : <SetupWizard />}
      <Toaster position="bottom-right" richColors />
    </>
  );
}
