import api, { unwrap } from './client';

/** Drops empty values so they don't end up in the query string. */
const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined),
  );

export const authApi = {
  me: () => unwrap(api.get('/auth/me')),
  login: (body) => unwrap(api.post('/auth/login', body)),
  register: (body) => unwrap(api.post('/auth/register', body)),
  logout: () => unwrap(api.post('/auth/logout')),
};

export const expenseApi = {
  list: (params) => unwrap(api.get('/expenses', { params: clean(params) })),
  create: (body) => unwrap(api.post('/expenses', body)),
  update: (id, body) => unwrap(api.patch(`/expenses/${id}`, body)),
  remove: (id) => api.delete(`/expenses/${id}`),
  exportCsv: (params) =>
    api.get('/expenses/export', { params: clean(params), responseType: 'blob' }),
};

export const categoryApi = {
  list: () => unwrap(api.get('/categories')),
  create: (body) => unwrap(api.post('/categories', body)),
  update: (id, body) => unwrap(api.patch(`/categories/${id}`, body)),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const budgetApi = {
  list: (month) => unwrap(api.get('/budgets', { params: { month } })),
  upsert: (body) => unwrap(api.put('/budgets', body)),
  remove: (id) => api.delete(`/budgets/${id}`),
};

export const analyticsApi = {
  summary: (month) => unwrap(api.get('/analytics/summary', { params: { month } })),
  byCategory: (month) => unwrap(api.get('/analytics/by-category', { params: { month } })),
  trend: (params) => unwrap(api.get('/analytics/trend', { params: clean(params) })),
};
