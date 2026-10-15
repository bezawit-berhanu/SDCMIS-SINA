import axios from "axios";
import { authStorage } from "../features/auth/auth_storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = authStorage.getToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const requestUrl = error.config?.url || "";
        const isAuthAttempt =
            requestUrl.includes("/auth/login") ||
            requestUrl.includes("/auth/register");

        // Only handle unauthorized for protected routes to avoid looping on login/register failures
        if (error.response?.status === 401 && !isAuthAttempt) {
            authStorage.clear();
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("auth:unauthorized"));
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;