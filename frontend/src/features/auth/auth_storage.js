const TOKEN_KEY = "sdcmis_access_token";
const USER_KEY = "sdcmis_user";

export const authStorage = {
    /**
     * Store accessToken and optionally the user object in sessionStorage.
     */
    save({ accessToken, user }) {
        if (typeof window === "undefined") return;

        if (accessToken) {
            sessionStorage.setItem(TOKEN_KEY, accessToken);
        }

        if (user) {
            sessionStorage.setItem(USER_KEY, JSON.stringify(user));
        }
    },

    /**
     * Retrieve the stored JWT access token.
     */
    getToken() {
        if (typeof window === "undefined") return null;
        return (
            sessionStorage.getItem(TOKEN_KEY) ||
            localStorage.getItem(TOKEN_KEY) ||
            localStorage.getItem("auth_token") ||
            localStorage.getItem("token")
        );
    },

    /**
     * Retrieve the stored user object.
     */
    getUser() {
        if (typeof window === "undefined") return null;
        try {
            const raw = sessionStorage.getItem(USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    /**
     * Check if an access token is currently stored.
     */
    hasToken() {
        return Boolean(this.getToken());
    },

    /**
     * Clear all stored session items.
     */
    clear() {
        if (typeof window === "undefined") return;
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
    },
};

export default authStorage;
