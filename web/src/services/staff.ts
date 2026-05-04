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

export interface StaffMember {
  id: string;
  username: string;
  display_name: string;
  avatar: string | null;
}

export const staffService = {
  async getStaffMembers(): Promise<StaffMember[]> {
    const response = await axiosInstance.get(`${API_URL}/staff/members`);
    return response.data;
  },
};
