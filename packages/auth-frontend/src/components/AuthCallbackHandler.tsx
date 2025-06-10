import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

/**
 * Authentication callback handler component
 *
 * This component handles the callback from the authentication server
 * and processes the token in the URL.
 */
export function AuthCallbackHandler() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");
        const refreshToken = urlParams.get("refresh_token");

        if (!token) {
          setError("No token found in URL");
          return;
        }

        // Refresh user data
        await refreshUser();

        // Redirect to home page or stored redirect URI
        const redirectUri = localStorage.getItem("post_login_redirect") || "/";
        localStorage.removeItem("post_login_redirect");

        navigate(redirectUri, { replace: true });
      } catch (err) {
        console.error("Error handling callback:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    handleCallback();
  }, [navigate, refreshUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Authentication Error</h1>
          <p className="mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Signing In...</h1>
        <div className="w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}
