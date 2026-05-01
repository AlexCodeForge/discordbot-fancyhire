import axios from 'axios';

const AUTH_URL = '/api/auth';

export const authService = {
  async login(username: string, password: string) {
    const response = await axios.post(`${AUTH_URL}/login`, { username, password });
    return response.data;
  },

  async verify(token: string) {
    const response = await axios.post(`${AUTH_URL}/verify`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};
