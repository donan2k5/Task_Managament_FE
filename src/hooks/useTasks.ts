import { useState, useEffect, useCallback } from "react";
import { Task } from "@/types/index";
import { taskService } from "@/services/task.service";
import { useToast } from "@/hooks/use-toast";

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarTasks, setCalendarTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 1. Fetch All Tasks (Dùng cho list tổng & Sidebar)
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await taskService.getAll();
      setTasks(data);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Load error",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Tự động load khi hook được gọi
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 2. Fetch cho Calendar
  const fetchCalendarTasks = useCallback(async (start: Date, end: Date) => {
    try {
      setLoading(true);
      const data = await taskService.getCalendarTasks(start, end);
      setCalendarTasks(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Add Task
  const addTask = async (taskData: Partial<Task>) => {
    const tempId = `temp-${Date.now()}`;
    const newTask = {
      ...taskData,
      _id: tempId,
      status: taskData.status || "backlog",
    } as Task;

    // Optimistic update
    setTasks((prev) => [...prev, newTask]);

    try {
      const { _id, ...payload } = newTask;
      const createdTask = await taskService.create(payload);
      // Thay thế task giả bằng task thật từ DB
      setTasks((prev) => prev.map((t) => (t._id === tempId ? createdTask : t)));
    } catch (err: any) {
      setTasks((prev) => prev.filter((t) => t._id !== tempId));
      toast({ variant: "destructive", title: "Add failed" });
    }
  };

  // 4. Update Task (SỬA LỖI F5 TẠI ĐÂY)
  const updateTask = async (id: string, updates: Partial<Task>) => {
    // A. Tìm task gốc để có đầy đủ thông tin (title, project...)
    const originalTask = tasks.find((t) => t._id === id);
    if (!originalTask) return;

    // B. Tạo object mới đã merge thông tin update
    const updatedTask = { ...originalTask, ...updates };

    // C. Update State 1: Danh sách tổng (Sidebar/Matrix)
    setTasks((prev) => prev.map((t) => (t._id === id ? updatedTask : t)));

    // D. Update State 2: Danh sách Lịch (QUAN TRỌNG)
    setCalendarTasks((prev) => {
      const existsInCalendar = prev.find((t) => t._id === id);

      if (existsInCalendar) {
        // Trường hợp 1: Task đang nằm trên lịch -> Update vị trí/giờ
        return prev.map((t) => (t._id === id ? updatedTask : t));
      } else {
        // Trường hợp 2: Task đang ở Sidebar (chưa có trong lịch)
        // Nếu bản update có chứa ngày (tức là vừa kéo thả vào) -> Thêm vào lịch ngay
        if (updates.scheduledDate) {
          return [...prev, updatedTask];
        }
        return prev;
      }
    });

    // E. Gọi API
    try {
      // Loại bỏ các trường rác của MongoDB trước khi gửi
      const { _id, createdAt, updatedAt, __v, ...cleanUpdates } =
        updates as any;
      await taskService.update(id, cleanUpdates);
    } catch (err: any) {
      // Nếu lỗi -> Load lại dữ liệu chuẩn từ server
      fetchTasks();
      fetchCalendarTasks(new Date(), new Date()); // Date này chỉ là ví dụ, logic thực tế sẽ dựa vào range hiện tại
      toast({ variant: "destructive", title: "Update failed" });
    }
  };

  // 5. Delete Task
  const deleteTask = async (id: string) => {
    // Xóa ngay lập tức ở cả 2 nơi
    setTasks((prev) => prev.filter((t) => t._id !== id));
    setCalendarTasks((prev) => prev.filter((t) => t._id !== id));

    try {
      await taskService.delete(id);
    } catch (err: any) {
      fetchTasks();
      toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  return {
    tasks,
    calendarTasks,
    loading,
    fetchTasks,
    fetchCalendarTasks,
    addTask,
    updateTask,
    deleteTask,
  };
};
