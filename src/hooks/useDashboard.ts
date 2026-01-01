import { useState, useEffect, useCallback, useRef } from "react";
import { dashboardService } from "@/services/dashboard.service";
import { projectService } from "@/services/project.service"; // Import project service
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/auth.service";
import { tokenManager } from "@/services/tokenManager";

export const useDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const hasFetched = useRef(false);

  const loadData = useCallback(async () => {
    // Only fetch if authenticated
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [result] = await Promise.all([
        dashboardService.getSummary(),
        new Promise((resolve) => setTimeout(resolve, 0)),
      ]);
      setData(result);
      hasFetched.current = true;
    } catch (error) {
      console.error("Dashboard load failed", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch attempt
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to token changes - re-fetch when token becomes available
  useEffect(() => {
    const unsubscribe = tokenManager.subscribe((token) => {
      // If token just became available and we haven't fetched yet, fetch now
      if (token && !hasFetched.current) {
        loadData();
      }
      // If token is cleared, reset state
      if (!token) {
        setData(null);
        hasFetched.current = false;
      }
    });

    return unsubscribe;
  }, [loadData]);

  // --- HÀM ADD PROJECT MỚI ---
  const addProject = async (name: string) => {
    // Optimistic Update: Thêm project giả vào list ngay lập tức
    const tempProject = {
      id: Date.now().toString(),
      name,
      tasksCount: 0,
      progress: 0,
      color: "hsl(262, 83%, 58%)", // Màu mặc định
      icon: "🚀",
    };

    setData((prev: any) => ({
      ...prev,
      projects: [tempProject, ...prev.projects],
    }));

    try {
      await projectService.create({
        name,
        description: "New project",
        color: "hsl(262, 83%, 58%)",
        icon: "🚀",
      });
      toast({ title: "Project created successfully" });
      // Load lại data thật để đồng bộ ID
      const result = await dashboardService.getSummary();
      setData(result);
    } catch (error) {
      // Rollback nếu lỗi
      setData((prev: any) => ({
        ...prev,
        projects: prev.projects.filter((p: any) => p.id !== tempProject.id),
      }));
      toast({ variant: "destructive", title: "Failed to create project" });
    }
  };

  return { data, loading, addProject }; // Export thêm addProject
};
