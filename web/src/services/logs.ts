import axios from 'axios';

const API_BASE = import.meta.env.DEV ? '' : '';
const LOGS_URL = `${API_BASE}/api/logs`;

export interface SystemLog {
  id: number;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  context: any;
  stack_trace?: string;
  user_id?: string;
  endpoint?: string;
  method?: string;
  ip_address?: string;
  created_at: string;
}

export interface LogsResponse {
  logs: SystemLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface LogStats {
  byLevel: { level: string; count: number }[];
  recent: { date: string; level: string; count: number }[];
}

export const logsApi = {
  async getLogs(params?: {
    level?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<LogsResponse> {
    const response = await axios.get(LOGS_URL, { params });
    return response.data;
  },

  async getStats(): Promise<LogStats> {
    const response = await axios.get(`${LOGS_URL}/stats`);
    return response.data;
  },

  async cleanup(): Promise<{ message: string; deleted: number; retentionDays: number }> {
    const response = await axios.delete(`${LOGS_URL}/cleanup`);
    return response.data;
  }
};
