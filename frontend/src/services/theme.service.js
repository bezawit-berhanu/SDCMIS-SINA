/**
 * Theme Service
 * Manages Dark / Light mode switching and persistence per FR-SET-02 & SCR-03.
 */
const THEME_STORAGE_KEY = "sdcimp_app_theme";

export const themeService = {
    getTheme() {
        try {
            const saved = localStorage.getItem(THEME_STORAGE_KEY);
            if (saved === "dark" || saved === "light") {
                return saved;
            }
            if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
                return "dark";
            }
        } catch (_) {}
        return "light";
    },

    setTheme(theme) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
            if (typeof document !== "undefined") {
                document.documentElement.setAttribute("data-theme", theme);
            }
        } catch (_) {}
    },

    initTheme() {
        const theme = this.getTheme();
        this.setTheme(theme);
        return theme;
    },

    toggleTheme() {
        const current = this.getTheme();
        const next = current === "dark" ? "light" : "dark";
        this.setTheme(next);
        return next;
    },
};

export default themeService;
