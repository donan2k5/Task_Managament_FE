import { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface KeyboardShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  enabled?: boolean;
}

// Component that provides keyboard shortcuts for navigation
export const KeyboardShortcutsProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Only allow Escape in input fields
        if (event.key !== "Escape") {
          return;
        }
      }

      // Don't trigger on login/register pages
      if (location.pathname === "/login" || location.pathname === "/register") {
        return;
      }

      // Check for key combinations (no modifier keys for navigation)
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "h":
          event.preventDefault();
          navigate("/");
          break;
        case "t":
          event.preventDefault();
          navigate("/tasks");
          break;
        case "m":
          event.preventDefault();
          navigate("/matrix");
          break;
        case "c":
          event.preventDefault();
          navigate("/calendar");
          break;
        case "p":
          event.preventDefault();
          navigate("/pomodoro");
          break;
        case "b":
          event.preventDefault();
          navigate("/habits");
          break;
        case "?":
          event.preventDefault();
          navigate("/settings");
          break;
        default:
          break;
      }
    },
    [navigate, location.pathname]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return <>{children}</>;
};

// Hook for custom shortcuts in specific components
export const useKeyboardShortcuts = (
  customShortcuts: KeyboardShortcutConfig[] = [],
  enabled: boolean = true
) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        if (event.key !== "Escape") {
          return;
        }
      }

      // Find matching shortcut
      for (const shortcut of customShortcuts) {
        if (shortcut.enabled === false) continue;

        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.altKey ? event.altKey : !event.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [customShortcuts, enabled]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return { shortcuts: customShortcuts };
};

export default useKeyboardShortcuts;
