import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // ← Important: This allows cookies to be sent
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add Access Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token request - cookie will be sent automatically
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/refresh`,
          {},
          { withCredentials: true }, // ← Crucial for sending HttpOnly cookie
        );

        const newAccessToken = res.data.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed → Force logout
          localStorage.removeItem("accessToken");
          console.error("Token refresh failed:", refreshError);
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
