import { describe, it, expect, vi, beforeEach } from 'vitest';
import { taskService } from './task.service';
import api from './api';

// Mock API
vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('taskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all tasks', async () => {
      const mockTasks = [
        { _id: '1', title: 'Task 1', status: 'todo' },
        { _id: '2', title: 'Task 2', status: 'done' },
      ];
      vi.mocked(api.get).mockResolvedValue({ data: mockTasks });

      const result = await taskService.getAll();

      expect(api.get).toHaveBeenCalledWith('/tasks');
      expect(result).toEqual(mockTasks);
    });

    it('should handle empty task list', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] });

      const result = await taskService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getByProject', () => {
    it('should fetch tasks by project id', async () => {
      const mockTasks = [{ _id: '1', title: 'Project Task', project: 'proj1' }];
      vi.mocked(api.get).mockResolvedValue({ data: mockTasks });

      const result = await taskService.getByProject('proj1');

      expect(api.get).toHaveBeenCalledWith('/tasks?project=proj1');
      expect(result).toEqual(mockTasks);
    });
  });

  describe('getCalendarTasks', () => {
    it('should fetch tasks within date range', async () => {
      const start = new Date('2026-01-01');
      const end = new Date('2026-01-07');
      const mockTasks = [
        { _id: '1', title: 'Calendar Task', scheduledDate: '2026-01-03' },
      ];
      vi.mocked(api.get).mockResolvedValue({ data: mockTasks });

      const result = await taskService.getCalendarTasks(start, end);

      expect(api.get).toHaveBeenCalledWith('/tasks/calendar', {
        params: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      });
      expect(result).toEqual(mockTasks);
    });

    it('should handle empty date range results', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] });

      const result = await taskService.getCalendarTasks(
        new Date('2026-01-01'),
        new Date('2026-01-02')
      );

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const newTask = {
        title: 'New Task',
        description: 'Description',
        isUrgent: true,
        isImportant: false,
      };
      const createdTask = { _id: 'new123', ...newTask };
      vi.mocked(api.post).mockResolvedValue({ data: createdTask });

      const result = await taskService.create(newTask);

      expect(api.post).toHaveBeenCalledWith('/tasks', newTask);
      expect(result).toEqual(createdTask);
    });

    it('should create task with minimum required fields', async () => {
      const minTask = { title: 'Minimal Task' };
      const createdTask = { _id: 'min123', ...minTask };
      vi.mocked(api.post).mockResolvedValue({ data: createdTask });

      const result = await taskService.create(minTask);

      expect(result._id).toBe('min123');
    });
  });

  describe('update', () => {
    it('should update an existing task', async () => {
      const updateData = { title: 'Updated Title', status: 'done' as const };
      const updatedTask = { _id: 'task123', ...updateData };
      vi.mocked(api.patch).mockResolvedValue({ data: updatedTask });

      const result = await taskService.update('task123', updateData);

      expect(api.patch).toHaveBeenCalledWith('/tasks/task123', updateData);
      expect(result).toEqual(updatedTask);
    });

    it('should update single field', async () => {
      const updateData = { status: 'todo' as const };
      vi.mocked(api.patch).mockResolvedValue({
        data: { _id: 'task456', status: 'todo' },
      });

      const result = await taskService.update('task456', updateData);

      expect(result.status).toBe('todo');
    });
  });

  describe('delete', () => {
    it('should delete a task', async () => {
      const deletedTask = { _id: 'del123', title: 'Deleted Task' };
      vi.mocked(api.delete).mockResolvedValue({ data: deletedTask });

      const result = await taskService.delete('del123');

      expect(api.delete).toHaveBeenCalledWith('/tasks/del123');
      expect(result).toEqual(deletedTask);
    });
  });

  describe('Error Handling', () => {
    it('should propagate API errors for getAll', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

      await expect(taskService.getAll()).rejects.toThrow('Network error');
    });

    it('should propagate API errors for create', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Validation error'));

      await expect(
        taskService.create({ title: 'Invalid' })
      ).rejects.toThrow('Validation error');
    });

    it('should propagate API errors for update', async () => {
      vi.mocked(api.patch).mockRejectedValue(new Error('Not found'));

      await expect(
        taskService.update('nonexistent', { title: 'Test' })
      ).rejects.toThrow('Not found');
    });

    it('should propagate API errors for delete', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('Forbidden'));

      await expect(taskService.delete('protected')).rejects.toThrow('Forbidden');
    });
  });
});
