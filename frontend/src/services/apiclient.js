import axios from "axios";
import { authStorage } from "../features/auth/auth_storage.js";

const API_BASE_URL = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "";

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

        if (token && !config.headers.Authorization) {
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
            requestUrl.includes("/auth/register") ||
            requestUrl.includes("/auth/signup");

        // Only handle unauthorized for protected routes to avoid looping on login/register failures
        if (error.response?.status === 401 && !isAuthAttempt) {
            authStorage.clear();
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("auth:unauthorized", {
                    detail: {
                        code: error.response?.data?.code || "ERR-UNAUTHORIZED",
                        message: error.response?.data?.message || "Session expired."
                    }
                }));
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
