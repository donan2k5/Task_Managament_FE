import { useState, useEffect, useCallback } from "react";
import { dashboardService } from "@/services/dashboard.service";
import { projectService } from "@/services/project.service"; // Import project service
import { useToast } from "@/hooks/use-toast";

export const useDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [result] = await Promise.all([
        dashboardService.getSummary(),
        new Promise((resolve) => setTimeout(resolve, 0)),
      ]);
      setData(result);
    } catch (error) {
      console.error("Dashboard load failed", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
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
