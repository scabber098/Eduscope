// === FILE: client/src/api/client.js ===
import axios from 'axios';

// In dev, Vite proxy forwards /api → localhost:4000, so baseURL='/api' works.
// In production or if proxy fails, use the full backend URL.
const BACKEND_URL = import.meta.env.VITE_API_URL || '';
const api = axios.create({ baseURL: `${BACKEND_URL}/api`, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pollcast_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // Log for debugging
    const url = err.config?.url || 'unknown';
    const status = err.response?.status;
    const msg = err.response?.data?.error || err.message;
    console.error(`[API Error] ${err.config?.method?.toUpperCase()} ${url} → ${status || 'NETWORK'}: ${msg}`);

    if (status === 401) {
      localStorage.removeItem('pollcast_token');
      localStorage.removeItem('pollcast_user');
      // Redirect to login if not already there — prevents cascade of "Missing token" toasts
      if (!window.location.pathname.startsWith('/auth') && !window.location.pathname.startsWith('/join')) {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(err);
  }
);

export const AuthAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }).then(r => r.data),
  register: (p) => api.post('/auth/register', p).then(r => r.data),
};

export const LectureAPI = {
  list: () => api.get('/lectures').then(r => r.data),
  create: (name) => api.post('/lectures', { name }).then(r => r.data),
  remove: (id) => api.delete(`/lectures/${id}`).then(r => r.data),
};

export const SessionAPI = {
  create: (payload) => api.post('/sessions', payload).then(r => r.data),
  list: () => api.get('/sessions').then(r => r.data),
  join: (code, name) => api.post('/sessions/join', { code, name }).then(r => r.data),
  check: (code) => api.get(`/sessions/check/${encodeURIComponent(code)}`).then(r => r.data),
  validate: (sessionId, participantId) => api.get(`/sessions/${sessionId}/validate/${participantId}`).then(r => r.data),
  live: (sessionId) => api.get(`/sessions/${sessionId}/live`).then(r => r.data),
  close: (sessionId) => api.patch(`/sessions/${sessionId}/close`).then(r => r.data),
  answer: (pollId, participantId, answerIndex) =>
    api.post('/sessions/answer', { pollId, participantId, answerIndex }).then(r => r.data),
  reportTabSwitch: (participantId) =>
    api.post('/sessions/tab-switch', { participantId }).then(r => r.data),
};

export const PollAPI = {
  create: (p) => api.post('/polls', p).then(r => r.data),
  forLecture: (id) => api.get(`/polls/${id}`).then(r => r.data),
  activeForStudent: () => api.get('/polls/active/student').then(r => r.data),
  close: (id) => api.patch(`/polls/${id}/close`).then(r => r.data),
};

export const ResponseAPI = {
  submit: (pollId, answerIndex) => api.post('/responses', { pollId, answerIndex }).then(r => r.data),
  me: () => api.get('/responses/me').then(r => r.data),
};

export const ReportAPI = {
  facultyDashboard: () => api.get('/reports/faculty/dashboard').then(r => r.data),
  studentDashboard: () => api.get('/reports/student/dashboard').then(r => r.data),
  lectureReport: (id) => api.get(`/reports/${id}`).then(r => r.data),
  leaderboard: () => api.get('/reports/leaderboard').then(r => r.data),
  students: () => api.get('/reports/faculty/students').then(r => r.data),
  studentDetail: (id) => api.get(`/reports/faculty/students/${id}`).then(r => r.data),
};

export const StudentAPI = {
  logActivity: (type, count) => api.post('/student/activity', { type, count, timestamp: Date.now() }).then(r => r.data),
  block: (registrationNumber) => api.put(`/student/block/${encodeURIComponent(registrationNumber)}`).then(r => r.data),
  unblock: (registrationNumber) => api.put(`/student/unblock/${encodeURIComponent(registrationNumber)}`).then(r => r.data),
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page)           qs.set('page', params.page);
    if (params.limit)          qs.set('limit', params.limit);
    if (params.university)     qs.set('university', params.university);
    if (params.isDisqualified !== undefined) qs.set('isDisqualified', params.isDisqualified);
    return api.get(`/students?${qs.toString()}`).then(r => r.data);
  },
  export: () => api.get('/students/export', { responseType: 'blob' }).then(r => r.data),
  add: (data) => api.post('/students', data).then(r => r.data),
  remove: (id) => api.delete(`/students/${id}`).then(r => r.data),
};

// NEW: Summary analytics (faculty/admin)
export const AnalyticsSummaryAPI = {
  summary: () => api.get('/analytics/summary').then(r => r.data),
};

// NEW: Poll timer
export const PollTimerAPI = {
  start: (pollId) => api.post(`/poll-timer/${pollId}/start`).then(r => r.data),
  autoSubmit: (pollId, answerIndex) => api.post(`/poll-timer/${pollId}/auto-submit`, { answerIndex }).then(r => r.data),
};

export const UniversityAPI = {
  list: () => api.get('/universities').then(r => r.data),
  get: (id) => api.get(`/universities/${id}`).then(r => r.data),
  departments: (universityId) => api.get(`/universities/${universityId}/departments`).then(r => r.data),
};

export const AnalyticsAPI = {
  leaderboard: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.universityId) qs.set('universityId', params.universityId);
    if (params.departmentId) qs.set('departmentId', params.departmentId);
    return api.get(`/analytics/leaderboard?${qs.toString()}`).then(r => r.data);
  },
  university: (universityId) => api.get(`/analytics/university/${universityId}`).then(r => r.data),
};

export default api;

export const AIInsightAPI = {
  getSession: (sessionId) => api.get(`/ai-insights/session/${sessionId}`).then(r => r.data),
  // Student AI Insights
  getStudentSession: (sessionId) => api.get(`/ai-insights/student/session/${sessionId}`).then(r => r.data),
  getStudentHistory: () => api.get('/ai-insights/student/history').then(r => r.data),
  // Faculty class overview
  getFacultySession: (sessionId) => api.get(`/ai-insights/faculty/session/${sessionId}`).then(r => r.data),
};

export const ScheduledSessionAPI = {
  list: () => api.get('/scheduled-sessions').then(r => r.data),
  create: (payload) => api.post('/scheduled-sessions', payload).then(r => r.data),
  edit: (id, payload) => api.patch(`/scheduled-sessions/${id}`, payload).then(r => r.data),
  remove: (id) => api.delete(`/scheduled-sessions/${id}`).then(r => r.data),
};

export const ReportExportAPI = {
  lectureCSV: (lectureId) => api.get(`/reports/${lectureId}/export/csv`, { responseType: 'blob' }).then(r => r.data),
};
