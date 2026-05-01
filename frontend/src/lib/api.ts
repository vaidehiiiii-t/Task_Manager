import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + "/api",
  withCredentials: true,
});

export default api;

// --- Auth ---
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

// --- Projects ---
export const projectsApi = {
  list: () => api.get("/projects"),
  create: (data: { name: string; description?: string }) =>
    api.post("/projects", data),
  get: (id: string) => api.get(`/projects/${id}`),
  delete: (id: string) => api.delete(`/projects/${id}`),
  addMember: (projectId: string, email: string) =>
    api.post(`/projects/${projectId}/members`, { email }),
  removeMember: (projectId: string, userId: string) =>
    api.delete(`/projects/${projectId}/members/${userId}`),
};

// --- Tasks ---
export const tasksApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/tasks`),
  create: (projectId: string, data: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: string;
    assignedToId?: string;
  }) => api.post(`/projects/${projectId}/tasks`, data),
  update: (projectId: string, taskId: string, data: Partial<{
    title: string;
    description: string;
    dueDate: string;
    priority: string;
    status: string;
    assignedToId: string;
  }>) => api.put(`/projects/${projectId}/tasks/${taskId}`, data),
  delete: (projectId: string, taskId: string) =>
    api.delete(`/projects/${projectId}/tasks/${taskId}`),
};

// --- Dashboard ---
export const dashboardApi = {
  get: () => api.get("/dashboard"),
};
