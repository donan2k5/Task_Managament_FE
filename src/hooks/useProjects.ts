import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/services/api";
import { Project } from "@/data/mockData";
import { authService } from "@/services/auth.service";
import { tokenManager } from "@/services/tokenManager";

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const fetchProjects = useCallback(async () => {
    // Only fetch if authenticated
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get<Project[]>("/projects");
      setProjects(response.data);
      hasFetched.current = true;
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch attempt
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Subscribe to token changes - re-fetch when token becomes available
  useEffect(() => {
    const unsubscribe = tokenManager.subscribe((token) => {
      // If token just became available and we haven't fetched yet, fetch now
      if (token && !hasFetched.current) {
        fetchProjects();
      }
      // If token is cleared, reset state
      if (!token) {
        setProjects([]);
        hasFetched.current = false;
      }
    });

    return unsubscribe;
  }, [fetchProjects]);

  return { projects, loading };
};
