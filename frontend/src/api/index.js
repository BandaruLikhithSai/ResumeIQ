import client from './client'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  me: () => client.get('/auth/me'),
  demoLogin: (role) => client.post('/auth/demo-login', { role }),
}

// ── Resume ────────────────────────────────────────────────────────────────────
export const resumeApi = {
  upload: (formData) => client.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  }),
  get: (id, includeText = false) => client.get(`/resume/${id}?include_text=${includeText}`),
  list: () => client.get('/resume/list'),
  delete: (id) => client.delete(`/resume/${id}`),
}

// ── Job ───────────────────────────────────────────────────────────────────────
export const jobApi = {
  create: (data) => client.post('/job/create', data),
  upload: (formData) => client.post('/job/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  get: (id) => client.get(`/job/${id}`),
  list: () => client.get('/job/list'),
  delete: (id) => client.delete(`/job/${id}`),
}

// ── Analysis ──────────────────────────────────────────────────────────────────
export const analysisApi = {
  run: (data) => client.post('/analysis/run', data, { timeout: 120000 }),
  get: (id) => client.get(`/analysis/${id}`),
  list: () => client.get('/analysis/list'),
  simulate: (id, data) => client.post(`/analysis/${id}/simulate`, data),
  graph: (id) => client.get(`/analysis/${id}/graph`),
}

// ── Recruiter ─────────────────────────────────────────────────────────────────
export const recruiterApi = {
  candidates: (params) => client.get('/recruiter/candidates', { params }),
  compare: (ids) => client.get('/recruiter/compare', { params: { analysis_ids: ids.join(',') } }),
  updateStatus: (id, label) => client.put(`/recruiter/candidates/${id}/status`, { label }),
}

// ── Graph ─────────────────────────────────────────────────────────────────────
export const graphApi = {
  full: () => client.get('/graph/full'),
  stats: () => client.get('/graph/stats'),
  skill: (name) => client.get(`/graph/skill/${encodeURIComponent(name)}`),
  path: (source, target) => client.get('/graph/path', { params: { source, target } }),
  subgraph: (skills, hops = 2) => client.get('/graph/subgraph', {
    params: { skills: skills.join(','), hops },
  }),
}

export default client
