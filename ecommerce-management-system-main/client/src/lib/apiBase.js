const fromVite = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL;
const fromCRA  = typeof process !== "undefined" && process.env && (process.env.REACT_APP_SERVER_URL || process.env.REACT_APP_API_BASE_URL);
const fromWin  = typeof window !== "undefined" && window.__API_BASE__;
const isBrowser = typeof window !== "undefined";
const sameOrigin = isBrowser ? window.location.origin : "";
const isLocalhost = sameOrigin.includes("localhost") || sameOrigin.includes("127.0.0.1");
const defaultBase = isLocalhost ? "http://localhost:4000" : sameOrigin;

const RAW = (fromVite || fromCRA || fromWin || defaultBase).toString();
export const API_BASE = RAW.replace(/\/+$/, "");

export default API_BASE;