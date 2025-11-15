import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (no auth required for demo)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Just pass through errors without auth redirect

    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  googleLogin: async (credential: string) => {
    const response = await api.post('/auth/google', { credential });
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    await api.post('/auth/logout', { refreshToken });
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.patch('/users/me', data);
    return response.data.data;
  },
};

export const deviceAPI = {
  list: async () => {
    const response = await api.get('/devices');
    return response.data.data.devices;
  },

  pair: async (deviceMac: string, deviceName: string) => {
    const response = await api.post('/devices/pair', { deviceMac, deviceName });
    return response.data.data.device;
  },

  requestUnlock: async (deviceId: string) => {
    const response = await api.post(`/devices/${deviceId}/unlock`);
    return response.data.data;
  },
};

export const goalAPI = {
  list: async (params?: any) => {
    const response = await api.get('/goals', { params });
    return response.data.data.goals;
  },

  create: async (data: any) => {
    const response = await api.post('/goals', data);
    return response.data;
  },

  verify: async (goalId: string, proof: any) => {
    const response = await api.post(`/goals/${goalId}/verify`, proof);
    return response.data.data;
  },

  delete: async (goalId: string) => {
    await api.delete(`/goals/${goalId}`);
  },
};
