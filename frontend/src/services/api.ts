import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  signup: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const decksApi = {
  getAll: (params?: { search?: string; tag?: string }) =>
    api.get('/decks', { params }),
  getOne: (id: string) => api.get(`/decks/${id}`),
  create: (data: { name: string; description?: string; tags?: string[] }) =>
    api.post('/decks', data),
  update: (id: string, data: { name?: string; description?: string; tags?: string[] }) =>
    api.put(`/decks/${id}`, data),
  delete: (id: string) => api.delete(`/decks/${id}`),
  getDashboardStats: () => api.get('/decks/stats/dashboard'),
};

export const aiApi = {
  generateFromText: (data: { text: string; difficulty?: string; count?: number }) =>
    api.post('/ai/generate/text', data),
  generateFromPDF: (file: File, difficulty?: string, count?: number) => {
    const formData = new FormData();
    formData.append('pdf', file);
    if (difficulty) formData.append('difficulty', difficulty);
    if (count) formData.append('count', String(count));
    return api.post('/ai/generate/pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  generateFromYouTube: (data: { url: string; difficulty?: string; count?: number }) =>
    api.post('/ai/generate/youtube', data),
  getJobStatus: (jobId: string) => api.get(`/ai/job/${jobId}`),
};

export const flashcardsApi = {
  getAll: (params?: { deckId?: string; dueOnly?: boolean; search?: string; tag?: string }) =>
    api.get('/flashcards', { params }),
  create: (data: { deckId: string; question: string; answer: string; difficulty?: string; tags?: string[] }) =>
    api.post('/flashcards', data),
  bulkCreate: (data: { deckId: string; flashcards: Array<{ question: string; answer: string; difficulty?: string; tags?: string[] }> }) =>
    api.post('/flashcards/bulk', data),
  update: (id: string, data: { question?: string; answer?: string; difficulty?: string; tags?: string[] }) =>
    api.put(`/flashcards/${id}`, data),
  delete: (id: string) => api.delete(`/flashcards/${id}`),
  review: (id: string, rating: string) => api.post(`/flashcards/${id}/review`, { rating }),
};

export default api;
