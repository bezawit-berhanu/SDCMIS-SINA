//Manages the current user authentication state, 
//restores the session by calling the exisiting endpoint and clear the session when the token get rejected.

import {
    createContext, useCallback, useContext, useEffect, useState,
} from "react";

import { authStorage } from "../auth_storage";
import { apiRequest } from "../../services/api_client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        authStorage.clear();
        setUser(null);
    }, []);

    const restoreSession = useCallback(async () => {
        const token = authStorage.getToken();

        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const response = await apiRequest("/auth/me");

            if (!response.ok) {
                logout();
                return;
            }

            const result = await response.json();
            const currentUser = result.data;

            setUser(currentUser);

            authStorage.save({
                accessToken: token,
                user: currentUser,
            });
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        restoreSession();
    }, [restoreSession]);


    useEffect(() => {
        const handleUnauthorized = () => logout();

        window.addEventListener(
            "auth:Unauthorized",
            handleUnauthorized
        );

        return () => {
            window.removeEventListener(
                "auth:Unauthorized",
                handleUnauthorized
            );
        }
    }, [logout]);

    const login = useCallback(async (credentials) => {
        const response = await apiRequest("/auth/login", {
            method: "post",
            body: JSON.stringfy(credentials),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Login Failed."
            );
        }

        const session = result.data;
        authStorage.save(session);
        setUser(session.user);

        return session.user;
    }, []);


    return (
        <AuthContext.Provider
            value={{ user, loading, login, logout, restoreSession }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider."
        );
    }
    return context;
}

export default AuthContext;