import { useState } from "react";
import { Heart, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { getSocket } from "@/lib/socket";

export function AuthGate() {
  const [token, setToken] = useState("");
  const isAuthenticating = useAuthStore((s) => s.isAuthenticating);
  const authError = useAuthStore((s) => s.authError);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    const store = useAuthStore.getState();
    store.setAuthenticating(true);
    store.setAuthError(null);

    const socket = getSocket();
    socket.emit("auth:validate", { token: token.trim() }, (result) => {
      if (result.success && result.userId) {
        store.setAuthenticated(result.userId, token.trim());
      } else {
        store.setAuthError(result.error || "Authentication failed");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Heart className="w-8 h-8 text-primary fill-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            HerSite
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your invite token to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Invite token"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isAuthenticating}
              autoFocus
            />
          </div>

          {authError && (
            <p className="text-sm text-red-500 text-center">{authError}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isAuthenticating || !token.trim()}
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Enter"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
