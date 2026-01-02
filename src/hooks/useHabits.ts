import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { HabitWithStats, CreateHabitDto, UpdateHabitDto } from '@/types/habit';
import { isSameDay } from 'date-fns';

export const useHabits = () => {
  return useQuery<HabitWithStats[]>({
    queryKey: ['habits'],
    queryFn: async () => {
      const response = await api.get('/habits');
      return response.data;
    },
  });
};

export const useCreateHabit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dto: CreateHabitDto) => {
      const response = await api.post('/habits', dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
};

export const useUpdateHabit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateHabitDto }) => {
      const response = await api.patch(`/habits/${id}`, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
};

export const useDeleteHabit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/habits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
};

export const useLogHabit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, date, completed }: { id: string; date?: string; completed?: boolean }) => {
      const response = await api.post(`/habits/${id}/log`, { date, completed });
      return response.data;
    },
    onMutate: async ({ id, date, completed }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['habits'] });

      // Snapshot the previous value
      const previousHabits = queryClient.getQueryData<HabitWithStats[]>(['habits']);

      // Optimistically update to the new value
      if (previousHabits) {
        queryClient.setQueryData<HabitWithStats[]>(['habits'], (old) => {
          if (!old) return [];
          return old.map((h) => {
            if (h.habit._id === id) {
              const targetDate = date ? new Date(date) : new Date();
              const logs = [...(h.thisWeekLogs || [])];
              const logIndex = logs.findIndex(l => isSameDay(new Date(l.date), targetDate));
              
              if (logIndex > -1) {
                if (completed === false) {
                  logs.splice(logIndex, 1);
                } else {
                  logs[logIndex] = { ...logs[logIndex], completed: true };
                }
              } else if (completed !== false) {
                logs.push({ date: targetDate.toISOString(), completed: true });
              }
              
              return { ...h, thisWeekLogs: logs };
            }
            return h;
          });
        });
      }

      // Also update any range logs queries
      queryClient.setQueriesData({ queryKey: ['habit-logs-range'] }, (old: any) => {
        if (!old) return [];
        const targetDate = date ? new Date(date) : new Date();
        const logs = [...old];
        const logIndex = logs.findIndex(l => 
          (typeof l.habitId === 'string' ? l.habitId === id : l.habitId?._id === id) && 
          isSameDay(new Date(l.date), targetDate)
        );

        if (logIndex > -1) {
          if (completed === false) {
            logs.splice(logIndex, 1);
          } else {
            logs[logIndex] = { ...logs[logIndex], completed: true };
          }
        } else if (completed !== false) {
          logs.push({ habitId: id, date: targetDate.toISOString(), completed: true });
        }
        return logs;
      });

      return { previousHabits };
    },
    onError: (err, variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(['habits'], context.previousHabits);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habit-logs-range'] });
    },
  });
};


