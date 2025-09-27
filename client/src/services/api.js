import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for session-based auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/login', credentials),
  register: (userData) => api.post('/register', userData),
  logout: () => api.get('/logout'),
  getCurrentUser: () => api.get('/api/user/me'),
};

// Batch API
export const batchAPI = {
  getAll: () => api.get('/api/batches'),
  create: (batchData) => api.post('/api/batches', batchData),
  update: (id, batchData) => api.put(`/api/batches/${id}`, batchData),
  delete: (id) => api.delete(`/api/batches/${id}`),
  assignTeachers: (batchId, teachers) => api.post('/batches/assign-teachers', { batch: batchId, teachers }),
  getAssignTeachers: () => api.get('/batches/assign-teachers'),
  // New filtering endpoints
  getSubjectsBySemester: (semester, department) => api.get('/batches/api/subjects-by-semester', { 
    params: { semester, department } 
  }),
  getTeachersBySubject: (subjectId) => api.get(`/batches/api/teachers-by-subject/${subjectId}`),
  getTeachersBySubjects: (subjectIds) => api.get('/batches/api/teachers-by-subjects', { 
    params: { subjectIds } 
  }),
};

// Faculty API
export const facultyAPI = {
  getAll: () => api.get('/api/faculty'),
  create: (facultyData) => api.post('/api/faculty', facultyData),
  update: (id, facultyData) => api.put(`/api/faculty/${id}`, facultyData),
  delete: (id) => api.delete(`/api/faculty/${id}`),
};

// Subject API
export const subjectAPI = {
  getAll: () => api.get('/api/subjects'),
  create: (subjectData) => api.post('/api/subjects', subjectData),
  update: (id, subjectData) => api.put(`/api/subjects/${id}`, subjectData),
  delete: (id) => api.delete(`/api/subjects/${id}`),
};

// Classroom API
export const classroomAPI = {
  getAll: () => api.get('/api/classrooms'),
  create: (classroomData) => api.post('/api/classrooms', classroomData),
  update: (id, classroomData) => api.put(`/api/classrooms/${id}`, classroomData),
  delete: (id) => api.delete(`/api/classrooms/${id}`),
};

// Constraint API
export const constraintAPI = {
  getAll: () => api.get('/constraints/api/constraints'),
  create: (constraintData) => api.post('/constraints/api/constraints', constraintData),
  delete: (id) => api.delete(`/constraints/api/constraints/${id}`),
  getBatchesBySemester: (semester, department) => api.get('/constraints/api/batches-by-semester', { 
    params: { semester, department } 
  }),
  getSubjectsByBatch: (batchId) => api.get(`/constraints/api/subjects-by-batch/${batchId}`),
};

// Special Class API
export const specialClassAPI = {
  getAll: () => api.get('/special-classes'),
  create: (classData) => api.post('/special-classes', classData),
  delete: (id) => api.post('/special-classes/delete', { id }),
};

// Timetable API
export const timetableAPI = {
  generate: (batchId, allBatches = false) => api.post('/api/timetable/generate', { batchId, allBatches }),
  getTimetable: () => api.get('/timetable'),
  review: (timetableData) => api.post('/timetable/review', timetableData),
};

export default api;
