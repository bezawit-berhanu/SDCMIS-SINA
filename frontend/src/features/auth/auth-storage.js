const TOKEN_KEY = "sdcmis_access_token";
const USER_KEY = "sdcmis_user";


export const authStorage = {
    save({ accessToken, user }) {
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    getUser() {
        try {
            const value = localStorage.getItem(USER_KEY);
            return value ? JSON.parse(value) : null;
        }
        catch {
            return null;
        }
    },

    clear() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
};