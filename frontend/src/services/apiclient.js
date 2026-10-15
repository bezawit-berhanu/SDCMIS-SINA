import axios from "axios";
import { authStorage } from "../features/auth/auth_storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        "Content_Type": "application/json",
        Accept: "application/json",
    },
});


apiClient.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem("sdcmis_access_token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;