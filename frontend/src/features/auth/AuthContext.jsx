/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import apiClient from "../../services/apiclient";
import { authStorage } from "./auth_storage";

/**
 * Safely parse JWT payload without external dependencies.
 */
function parseJwtPayload(token) {
    if (!token || typeof token !== "string") return null;
    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => authStorage.getUser());
    const [loading, setLoading] = useState(() => {
        const token = authStorage.getToken();
        if (!token) return false;
        const payload = parseJwtPayload(token);
        if (payload?.exp && payload.exp * 1000 <= Date.now()) {
            authStorage.clear();
            return false;
        }
        return true;
    });

    const expiryTimerRef = useRef(null);

    const clearExpiryTimer = useCallback(() => {
        if (expiryTimerRef.current) {
            clearTimeout(expiryTimerRef.current);
            expiryTimerRef.current = null;
        }
    }, []);

    const logout = useCallback(() => {
        clearExpiryTimer();
        authStorage.clear();
        setUser(null);
        setLoading(false);
    }, [clearExpiryTimer]);

    const scheduleExpiryLogout = useCallback(
        (token) => {
            clearExpiryTimer();
            const payload = parseJwtPayload(token);
            if (!payload?.exp) return;

            const remainingTimeMs = payload.exp * 1000 - Date.now();
            if (remainingTimeMs <= 0) {
                logout();
                return;
            }

            const delay = Math.min(remainingTimeMs, 2147483647);
            expiryTimerRef.current = setTimeout(() => {
                logout();
            }, delay);
        },
        [clearExpiryTimer, logout]
    );

    const restoreSession = useCallback(async () => {
        const token = authStorage.getToken();

        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        const payload = parseJwtPayload(token);
        if (payload?.exp && payload.exp * 1000 <= Date.now()) {
            logout();
            setLoading(false);
            return;
        }

        const cachedUser = authStorage.getUser();
        if (cachedUser) {
            setUser(cachedUser);
        }

        try {
            const response = await apiClient.get("/api/v1/auth/me");
            const userData =
                response.data?.data?.user ||
                response.data?.user ||
                response.data?.data;

            if (userData) {
                setUser(userData);
                authStorage.save({ accessToken: token, user: userData });
            }

            scheduleExpiryLogout(token);
        } catch (error) {
            if (error.response?.status === 401) {
                logout();
            } else if (cachedUser) {
                scheduleExpiryLogout(token);
            }
        } finally {
            setLoading(false);
        }
    }, [logout, scheduleExpiryLogout]);

    useEffect(() => {
        let isMounted = true;
        const token = authStorage.getToken();

        if (!token) {
            return;
        }

        const payload = parseJwtPayload(token);
        if (payload?.exp && payload.exp * 1000 <= Date.now()) {
            queueMicrotask(() => {
                if (isMounted) {
                    logout();
                }
            });
            return;
        }

        apiClient
            .get("/api/v1/auth/me")
            .then((response) => {
                if (!isMounted) return;
                const userData =
                    response.data?.data?.user ||
                    response.data?.user ||
                    response.data?.data;

                if (userData) {
                    setUser(userData);
                    authStorage.save({ accessToken: token, user: userData });
                }

                scheduleExpiryLogout(token);
            })
            .catch((error) => {
                if (!isMounted) return;
                if (error.response?.status === 401) {
                    logout();
                } else {
                    scheduleExpiryLogout(token);
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [logout, scheduleExpiryLogout]);

    useEffect(() => {
        const handleUnauthorized = () => {
            logout();
        };

        window.addEventListener("auth:unauthorized", handleUnauthorized);
        window.addEventListener("auth:Unauthorized", handleUnauthorized);

        return () => {
            window.removeEventListener("auth:unauthorized", handleUnauthorized);
            window.removeEventListener("auth:Unauthorized", handleUnauthorized);
            clearExpiryTimer();
        };
    }, [logout, clearExpiryTimer]);

    const login = useCallback(
        async (credentials) => {
            const response = await apiClient.post("/api/v1/auth/login", credentials);
            const data = response.data?.data || response.data;
            const accessToken = data.accessToken;
            const authenticatedUser = data.user;

            if (!accessToken) {
                throw new Error("Authentication response did not return an access token.");
            }

            authStorage.save({
                accessToken,
                user: authenticatedUser,
            });

            setUser(authenticatedUser);
            scheduleExpiryLogout(accessToken);

            return authenticatedUser;
        },
        [scheduleExpiryLogout]
    );

    const value = {
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        restoreSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider.");
    }
    return context;
}

export default AuthContext;