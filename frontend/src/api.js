import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

// Attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('forum_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me')
};

export const categoriesAPI = { getAll: () => api.get('/categories'), getBySlug: (slug) => api.get(`/categories/${slug}`) };
export const threadsAPI = {
  getAll: (params) => api.get('/threads', { params }),
  getById: (id) => api.get(`/threads/${id}`),
  create: (data) => api.post('/threads', data)
};
export const postsAPI = {
  getAll: (params) => api.get('/posts', { params }),
  create: (data) => api.post('/posts', data),
  like: (id) => api.post(`/posts/${id}/like`),
  update: (id, data) => api.put(`/posts/${id}`, data)
};
export const usersAPI = { getProfile: (username) => api.get(`/users/${username}`), getThreads: (username) => api.get(`/users/${username}/threads`) };
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getCategories: () => api.get('/admin/categories'),
  createCategory: (d) => api.post('/admin/categories', d),
  updateCategory: (id, d) => api.put(`/admin/categories/${id}`, d),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  getUsers: () => api.get('/admin/users'),
  createUser: (d) => api.post('/admin/users', d),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  banUser: (id, ban) => api.put(`/admin/users/${id}/ban`, { is_banned: ban }),
  getThreads: () => api.get('/admin/threads'),
  createThread: (d) => api.post('/threads', d),
  updateThread: (id, d) => api.put(`/admin/threads/${id}`, d),
  deleteThread: (id) => api.delete(`/admin/threads/${id}`),
  getPages: () => api.get('/admin/pages'),
  createPage: (d) => api.post('/admin/pages', d),
  updatePage: (id, d) => api.put(`/admin/pages/${id}`, d),
  deletePage: (id) => api.delete(`/admin/pages/${id}`),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (d) => api.put('/admin/settings', d),
  getAnnouncements: () => api.get('/admin/announcements'),
  createAnnouncement: (d) => api.post('/admin/announcements', d),
  deleteAnnouncement: (id) => api.delete(`/admin/announcements/${id}`)
};

export default api;
