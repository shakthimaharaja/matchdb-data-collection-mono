import axios from "axios";

const api = axios.create({
  baseURL: "",
  headers: { "Content-Type": "application/json" },
});

// Auto-attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dc_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== "/login") {
      localStorage.removeItem("dc_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default api;
