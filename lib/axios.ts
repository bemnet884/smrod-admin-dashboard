import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie"; // Import this!

const baseURL = process.env.NEXT_PUBLIC_API_URL || "https://backend-vr5u.onrender.com";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Check Cookie first, then LocalStorage
    const token =
      Cookies.get("accessToken") ||
      (typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // STOP THE LOOP: Remove the cookie so Middleware lets you stay on /login
      if (typeof window !== "undefined") {
        Cookies.remove("accessToken", { path: "/" }); // <--- CRITICAL FIX
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
