import axios from 'axios';
import { Lead, LeadHistory } from '../types/Lead';

const API_BASE = import.meta.env.DEV ? '' : '';
const API_URL = `${API_BASE}/api/leads`;
const MESSAGES_URL = `${API_BASE}/api/messages`;

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  async getAllLeads(): Promise<Lead[]> {
    const response = await axios.get(API_URL);
    return response.data;
  },

  async getLeadById(id: number): Promise<Lead> {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  async createLead(data: Partial<Lead>): Promise<Lead> {
    const response = await axios.post(API_URL, data);
    return response.data;
  },

  async updateLead(id: number, data: Partial<Lead>): Promise<Lead> {
    const response = await axios.patch(`${API_URL}/${id}`, data);
    return response.data;
  },

  async deleteLead(id: number): Promise<void> {
    await axios.delete(`${API_URL}/${id}`);
  },

  async getLeadHistory(id: number): Promise<LeadHistory[]> {
    const response = await axios.get(`${API_URL}/${id}/history`);
    return response.data;
  },

  async getMessages(leadId: number): Promise<any[]> {
    const response = await axios.get(`${MESSAGES_URL}/${leadId}`);
    return response.data;
  },

  async sendMessage(leadId: number, content: string, senderName: string): Promise<any> {
    const response = await axios.post(`${MESSAGES_URL}/${leadId}/send`, {
      content,
      sender_name: senderName
    });
    return response.data;
  },

  async markMessagesRead(leadId: number): Promise<void> {
    await axios.patch(`${MESSAGES_URL}/${leadId}/mark-read`);
  },

  async getUnreadCount(leadId: number): Promise<number> {
    const response = await axios.get(`${MESSAGES_URL}/${leadId}/unread`);
    return response.data.count;
  },
};
