import { NODE_ENV } from "../../helpers/AppConstants";

const SESSION_COOKIE = "online_store";
const EXPIRY_MINUTES = NODE_ENV === "development" ? 150 : 5;

export const saveSessionCookie = (data: any) => {
    const expires = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000).toUTCString();
    const encoded = encodeURIComponent(JSON.stringify(data));
    document.cookie = `${SESSION_COOKIE}=${encoded}; expires=${expires}; path=/; SameSite=Lax`;
};

export const updateSessionCookie = (newData: any) => {
    const existing = loadSessionCookie();
    if (!existing) return;
    const currentCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${SESSION_COOKIE}=`));
    if (!currentCookie) return;
    const expiryMatch = currentCookie.match(/expires=([^;]+)/);
    const existingExpiry = expiryMatch ? expiryMatch[1] : undefined;
    const updated = { ...existing, ...newData };
    const encoded = encodeURIComponent(JSON.stringify(updated));
    if (existingExpiry) {
        document.cookie = `${SESSION_COOKIE}=${encoded}; expires=${existingExpiry}; path=/; SameSite=Lax`;
    }
};

export const loadSessionCookie = () => {
    const cookieString = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${SESSION_COOKIE}=`));
    if (!cookieString) return null;
    try {
        const value = cookieString.split("=")[1];
        return JSON.parse(decodeURIComponent(value));
    } catch {
        clearSessionCookie();
        return null;
    }
};

export const clearSessionCookie = () => {
    document.cookie = `${SESSION_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};
