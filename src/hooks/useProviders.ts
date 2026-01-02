import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Types
export interface ProviderConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface Calendar {
  id: string;
  providerId: string;
  name: string;
  description?: string;
  color?: string;
  primary?: boolean;
  accessRole?: 'owner' | 'writer' | 'reader';
}

export interface CalendarEvent {
  id: string;
  providerId: string;
  calendarId: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  location?: string;
  color?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  source: 'google' | 'microsoft' | 'github' | 'local';
}

export interface CreateEventDto {
  calendarId: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  location?: string;
}

// Query Keys
export const providerKeys = {
  all: ['providers'] as const,
  connected: () => [...providerKeys.all, 'connected'] as const,
  calendars: (providerId: string) => [...providerKeys.all, providerId, 'calendars'] as const,
  events: (providerId: string, start: string, end: string, calendarId?: string) => 
    [...providerKeys.all, providerId, 'events', start, end, calendarId] as const,
};

/**
 * Get all available providers
 */
export const useProviders = () => {
  return useQuery<ProviderConfig[]>({
    queryKey: providerKeys.all,
    queryFn: async () => {
      const { data } = await api.get('/providers');
      return data;
    },
  });
};

/**
 * Get connected providers for current user
 */
export const useConnectedProviders = () => {
  return useQuery<ProviderConfig[]>({
    queryKey: providerKeys.connected(),
    queryFn: async () => {
      const { data } = await api.get('/providers/connected');
      return data;
    },
  });
};

/**
 * Get calendars for a provider
 */
export const useProviderCalendars = (providerId: string) => {
  return useQuery<Calendar[]>({
    queryKey: providerKeys.calendars(providerId),
    queryFn: async () => {
      const { data } = await api.get(`/providers/${providerId}/calendars`);
      return data;
    },
    enabled: !!providerId,
  });
};

/**
 * Get events from a provider
 */
export const useProviderEvents = (
  providerId: string,
  start: Date,
  end: Date,
  calendarId?: string,
) => {
  const startStr = start.toISOString();
  const endStr = end.toISOString();

  return useQuery<CalendarEvent[]>({
    queryKey: providerKeys.events(providerId, startStr, endStr, calendarId),
    queryFn: async () => {
      const params = new URLSearchParams({ start: startStr, end: endStr });
      if (calendarId) params.append('calendarId', calendarId);
      
      const { data } = await api.get(`/providers/${providerId}/events?${params}`);
      // Parse dates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    },
    enabled: !!providerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Create event on a provider
 */
export const useCreateEvent = (providerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: CreateEventDto) => {
      const { data } = await api.post(`/providers/${providerId}/events`, event);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...providerKeys.all, providerId, 'events'] });
    },
  });
};

/**
 * Update event on a provider
 */
export const useUpdateEvent = (providerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      calendarId,
      eventId,
      event,
    }: {
      calendarId: string;
      eventId: string;
      event: UpdateEventDto;
    }) => {
      const { data } = await api.patch(
        `/providers/${providerId}/calendars/${calendarId}/events/${eventId}`,
        event,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...providerKeys.all, providerId, 'events'] });
    },
  });
};

/**
 * Delete event from a provider
 */
export const useDeleteEvent = (providerId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      calendarId,
      eventId,
    }: {
      calendarId: string;
      eventId: string;
    }) => {
      await api.delete(`/providers/${providerId}/calendars/${calendarId}/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...providerKeys.all, providerId, 'events'] });
    },
  });
};
