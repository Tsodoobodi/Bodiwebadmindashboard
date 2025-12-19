// lib/surveyApi.ts
import api from './api';

export interface Survey {
  id: string;
  title: string;
  embed_url: string;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SurveyStats {
  total: string;
  active: string;
  inactive: string;
  draft: string;
  deleted: string;
}

export const surveyApi = {
  // Get all surveys
  getAll: async (includeDeleted = false, status?: string): Promise<Survey[]> => {
    const params: Record<string, string> = {}; // ✅ any -> Record<string, string>
    if (includeDeleted) params.includeDeleted = 'true';
    if (status) params.status = status;

    const response = await api.get('/api/surveys', { params });
    return response.data.data;
  },

  // Get single survey
  getById: async (id: string): Promise<Survey> => {
    const response = await api.get(`/api/surveys/${id}`);
    return response.data.data;
  },

  // Create survey
  create: async (input: {
    title: string;
    embed_url: string;
    status?: 'active' | 'inactive' | 'draft';
  }): Promise<Survey> => {
    const response = await api.post('/api/surveys', input);
    return response.data.data;
  },

  // Update survey
  update: async (
    id: string,
    input: {
      title?: string;
      embed_url?: string;
      status?: 'active' | 'inactive' | 'draft';
    }
  ): Promise<Survey> => {
    const response = await api.patch(`/api/surveys/${id}`, input);
    return response.data.data;
  },

  // Delete survey
  delete: async (id: string, permanent = false): Promise<void> => {
    const url = permanent ? `/api/surveys/${id}?permanent=true` : `/api/surveys/${id}`;
    await api.delete(url);
  },

  // Restore survey
  restore: async (id: string): Promise<Survey> => {
    const response = await api.post(`/api/surveys/${id}/restore`);
    return response.data.data;
  },

  // Get stats
  getStats: async (): Promise<SurveyStats> => {
    const response = await api.get('/api/surveys/stats');
    return response.data.data;
  },
};