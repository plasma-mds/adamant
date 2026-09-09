// Standard opt-in "Remember me" pattern: sessionStorage by default (cleared when the
// browser/tab closes), promoted to localStorage (persists across restarts) only when the
// user explicitly opts in. Never both at once, so switching remember off on next login
// doesn't leave a stale copy behind in the other storage.

export const getRemembered = (key) => {
    const local = window.localStorage.getItem(key);
    if (local !== null) return local;
    return window.sessionStorage.getItem(key);
};

export const setRemembered = (key, value, remember) => {
    if (remember) {
        window.localStorage.setItem(key, value);
        window.sessionStorage.removeItem(key);
    } else {
        window.sessionStorage.setItem(key, value);
        window.localStorage.removeItem(key);
    }
};

export const isRemembered = (key) => window.localStorage.getItem(key) !== null;
