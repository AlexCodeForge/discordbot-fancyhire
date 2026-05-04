import axios from 'axios';

const API_URL = '/api';

// Configure axios to include auth token
const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Setting {
  key: string;
  value: string | null;
  updated_at: string;
}

export const settingsService = {
  async getSettings(): Promise<Setting[]> {
    const response = await axiosInstance.get(`${API_URL}/settings`);
    return response.data;
  },

  async getSetting(key: string): Promise<Setting> {
    const response = await axiosInstance.get(`${API_URL}/settings/${key}`);
    return response.data;
  },

  async updateSetting(key: string, value: string | null): Promise<Setting> {
    const response = await axiosInstance.patch(`${API_URL}/settings`, { key, value });
    return response.data;
  },
};
