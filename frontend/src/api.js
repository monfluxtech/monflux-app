import axios from 'axios';

const _base = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const BASE = _base.endsWith('/api') ? _base : `${_base}/api`;

const http = axios.create({ baseURL: BASE });

http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  signup: (data)       => http.post('/auth/signup', data),
  login:  (data)       => http.post('/auth/login',  data),
  me:     ()           => http.get('/auth/me'),
  update: (data)       => http.patch('/auth/me', data),
};

export const onboarding = {
  session: ()          => http.post('/onboarding/session'),
  complete: (data)     => http.post('/onboarding/complete', data),
  // streaming: call fetch() directly with SSE
};

export const companies = {
  get:           ()         => http.get('/companies'),
  update:        (data)     => http.patch('/companies', data),
  updateConfig:  (data)     => http.patch('/companies/config', data),
  updateLeadSource: (source, data) => http.patch(`/companies/config/lead-sources/${source}`, data),
};

export const projects = {
  list:        ()           => http.get('/projects'),
  get:         (id)         => http.get(`/projects/${id}`),
  create:      (data)       => http.post('/projects', data),
  update:      (id, data)   => http.patch(`/projects/${id}`, data),
  delete:      (id)         => http.delete(`/projects/${id}`),
  addPhase:    (id, data)   => http.post(`/projects/${id}/phases`, data),
  updatePhase: (id, pid, data) => http.patch(`/projects/${id}/phases/${pid}`, data),
  resetPortalToken: (id)    => http.post(`/projects/${id}/reset-portal-token`),
  getPortalMessages: (id)   => http.get(`/projects/${id}/portal-messages`),
};

export const leads = {
  list:   (params)      => http.get('/leads', { params }),
  get:    (id)          => http.get(`/leads/${id}`),
  create: (data)        => http.post('/leads', data),
  update: (id, data)    => http.patch(`/leads/${id}`, data),
  delete: (id)          => http.delete(`/leads/${id}`),
};

export const contacts = {
  list:   (params)      => http.get('/contacts', { params }),
  get:    (id)          => http.get(`/contacts/${id}`),
  create: (data)        => http.post('/contacts', data),
  update: (id, data)    => http.patch(`/contacts/${id}`, data),
  delete: (id)          => http.delete(`/contacts/${id}`),
};

export const quotes = {
  list:   ()            => http.get('/quotes'),
  get:    (id)          => http.get(`/quotes/${id}`),
  create: (data)        => http.post('/quotes', data),
  update: (id, data)    => http.patch(`/quotes/${id}`, data),
  delete: (id)          => http.delete(`/quotes/${id}`),
  convert: (id)         => http.post(`/quotes/${id}/convert`),
};

export const invoices = {
  list:   (params)      => http.get('/invoices', { params }),
  get:    (id)          => http.get(`/invoices/${id}`),
  create: (data)        => http.post('/invoices', data),
  update: (id, data)    => http.patch(`/invoices/${id}`, data),
  delete: (id)          => http.delete(`/invoices/${id}`),
};

export const subcontractors = {
  list:   ()            => http.get('/subcontractors'),
  create: (data)        => http.post('/subcontractors', data),
  update: (id, data)    => http.patch(`/subcontractors/${id}`, data),
  delete: (id)          => http.delete(`/subcontractors/${id}`),
};

export const rfqs = {
  list:   ()            => http.get('/rfqs'),
  create: (data)        => http.post('/rfqs', data),
  invite: (id, ids)     => http.post(`/rfqs/${id}/invite`, { subcontractor_ids: ids }),
};

export const punch = {
  generate: (data)      => http.post('/punch/generate', data),
  clockIn:  (data)      => http.post('/punch/clock-in', data),
  clockOut: (data)      => http.post('/punch/clock-out', data),
  getSite:  (token)     => http.get(`/punch/${token}`),
};

export const timesheets = {
  list:    (params)     => http.get('/timesheets', { params }),
  approve: (id)         => http.patch(`/timesheets/${id}/approve`),
};

export const documents = {
  list:    (projectId)  => http.get(`/documents/project/${projectId}`),
  upload:  (data)       => http.post('/documents', data),
};

export const pdf = {
  quoteUrl:   (id) => `${BASE}/pdf/quote/${id}`,
  invoiceUrl: (id) => `${BASE}/pdf/invoice/${id}`,
};

export const email = {
  sendQuote:   (id, data) => http.post(`/email/quote/${id}`, data),
  sendInvoice: (id, data) => http.post(`/email/invoice/${id}`, data),
};

export const ai = {
  healthCheck:  ()       => http.get('/ai/health-check'),
  estimate:     (data)   => http.post('/ai/estimate', data),
  actions:      ()       => http.get('/ai/actions'),
  updateAction: (id, data) => http.patch(`/ai/actions/${id}`, data),
  newConversation: (data)  => http.post('/chat/conversations', data),
};

export const dashboard = {
  summary:       () => http.get('/dashboard/summary'),
  activity:      () => http.get('/dashboard/activity'),
  presence:      () => http.get('/dashboard/presence'),
  notifications: () => http.get('/dashboard/notifications'),
};

export const quittances = {
  list:   (params)    => http.get('/quittances', { params }),
  create: (data)      => http.post('/quittances', data),
  update: (id, data)  => http.patch(`/quittances/${id}`, data),
  delete: (id)        => http.delete(`/quittances/${id}`),
};

export const changeOrders = {
  list:   (params)    => http.get('/change-orders', { params }),
  create: (data)      => http.post('/change-orders', data),
  update: (id, data)  => http.patch(`/change-orders/${id}`, data),
  delete: (id)        => http.delete(`/change-orders/${id}`),
};

export const dev = {
  plans:   ()            => http.get('/dev/plans'),
  current: ()            => http.get('/dev/current'),
  switch:  (data)        => http.post('/dev/switch', data),
  clear:   ()            => http.delete('/dev/switch'),
};

export default http;
