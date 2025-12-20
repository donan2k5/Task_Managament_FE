import { useState, useEffect } from "react";
import api from "@/services/api"; // Sử dụng instance axios đã tạo
import { Project } from "@/data/mockData";

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Giả sử bạn đã có API GET /projects. Nếu chưa có thì backend phải viết thêm.
        // Nếu backend chưa có, nó sẽ trả về mảng rỗng và code không chết.
        const response = await api.get<Project[]>("/projects");
        setProjects(response.data);
      } catch (error) {
        console.error("Failed to fetch projects", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return { projects, loading };
};
