import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.service";
import { syncService } from "@/services/sync.service";
import { Loader2, CheckCircle, XCircle, Calendar } from "lucide-react";

type CallbackState =
  | "loading"
  | "processing"
  | "initializing_sync"
  | "success"
  | "error";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  const [state, setState] = useState<CallbackState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get("accessToken");
      const refreshToken = params.get("refreshToken");
      const userId = params.get("userId");
      const success = params.get("success");
      const error = params.get("error");

      if (error) {
        setState("error");
        setErrorMessage(error || "Authentication failed");
        return;
      }

      if (success === "true") {
        setState("processing");

        // Handle JWT-based flow (new)
        if (accessToken && refreshToken && userId) {
          // Sử dụng handleOAuthCallback từ AuthContext
          // Để update cả tokenManager VÀ React state
          await handleOAuthCallback(accessToken, refreshToken, userId);
        }
        // Handle legacy userId-only flow
        else if (userId) {
          authService.setUserId(userId);
        } else {
          setState("error");
          setErrorMessage("Invalid callback parameters");
          return;
        }

        // Initialize sync (creates Axis calendar automatically)
        // Backend extracts userId from JWT token
        setState("initializing_sync");
        try {
          await syncService.initialize();
          setState("success");
        } catch (err) {
          // Sync initialization may fail if already initialized, but that's okay
          console.warn("Sync initialization warning:", err);
          setState("success");
        }

        // Get redirect path from session storage
        const redirectPath = sessionStorage.getItem("authRedirect") || "/";
        sessionStorage.removeItem("authRedirect");

        // Clean up URL params
        window.history.replaceState({}, "", window.location.pathname);

        // Redirect after short delay
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 2000);
      } else {
        setState("error");
        setErrorMessage("Invalid callback parameters");
      }
    };

    handleCallback();
  }, [navigate, handleOAuthCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        {state === "loading" && (
          <>
            <Loader2 className="w-16 h-16 mx-auto text-blue-500 animate-spin" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Processing authentication...
            </h2>
            <p className="mt-2 text-gray-600">Please wait a moment.</p>
          </>
        )}

        {state === "processing" && (
          <>
            <Loader2 className="w-16 h-16 mx-auto text-blue-500 animate-spin" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Setting up your account...
            </h2>
            <p className="mt-2 text-gray-600">Almost there!</p>
          </>
        )}

        {state === "initializing_sync" && (
          <>
            <div className="relative">
              <Calendar className="w-16 h-16 mx-auto text-blue-500" />
              <Loader2 className="w-6 h-6 absolute bottom-0 right-1/2 translate-x-6 text-blue-500 animate-spin" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Setting up your Axis calendar...
            </h2>
            <p className="mt-2 text-gray-600">
              Creating your dedicated calendar in Google Calendar.
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Successfully connected!
            </h2>
            <p className="mt-2 text-gray-600">
              Your Google Calendar is now synced with Axis. All your scheduled
              tasks will appear in your Axis calendar.
            </p>
            <p className="mt-2 text-sm text-gray-500">Redirecting...</p>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle className="w-16 h-16 mx-auto text-red-500" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Authentication failed
            </h2>
            <p className="mt-2 text-red-600">{errorMessage}</p>
            <div className="mt-4 space-x-2">
              <button
                onClick={() => navigate("/login", { replace: true })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => navigate("/", { replace: true })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
