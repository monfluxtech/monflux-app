import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const auth = {
  signup: (email, password) => api.post('/auth/signup', { email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  onboarding: (data) => api.post('/auth/onboarding', data)
};

// Projects
export const projects = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`)
};

// Chat
export const chat = {
  send: (projectId, message) => api.post(`/chat/${projectId}/message`, { message }),
  history: (projectId) => api.get(`/chat/${projectId}/history`)
};

// Forms
export const forms = {
  templates: () => api.get('/forms/templates'),
  submit: (projectId, formType, data) => api.post(`/forms/${projectId}/submit`, { formType, data }),
  submissions: (projectId) => api.get(`/forms/${projectId}/submissions`)
};

// Contacts
export const contacts = {
  list: () => api.get('/contacts'),
  create: (data) => api.post('/contacts', data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  delete: (id) => api.delete(`/contacts/${id}`)
};

// Teams
export const teams = {
  members: (projectId) => api.get(`/teams/${projectId}/members`),
  invite: (projectId, data) => api.post(`/teams/${projectId}/members`, data),
  remove: (projectId, memberId) => api.delete(`/teams/${projectId}/members/${memberId}`)
};

export default api;
