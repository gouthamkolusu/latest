// client/src/lib/apiClient.js
import { getAuth } from "firebase/auth";

const rawBase =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:4000";

export const API_BASE = rawBase.replace(/\/+$/, "");

async function authHeaders() {
  try {
    const u = getAuth().currentUser;
    if (!u) return {};
    const t = await u.getIdToken();
    return { Authorization: `Bearer ${t}` };
  } catch {
    return {};
  }
}

export async function apiFetch(path, opts = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
    ...(await authHeaders()),
  };
  return fetch(url, { ...opts, headers });
}

export async function apiGet(path) {
  const res = await apiFetch(path, { method: "GET" });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await apiFetch(path, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPut(path, body) {
  const res = await apiFetch(path, {
    method: "PUT",
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiDelete(path) {
  const res = await apiFetch(path, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
  return res.json();
}

// ---- Specific APIs ----
export async function apiGetAllOrders() {
  return apiGet("/api/orders/all");
}

// ---- Shipping (EasyPost via your backend) ----
export async function getShippingRates(payload) {
  return apiPost("/api/shipping/rates", payload);
}

export async function buyShippingLabel({ shipmentId, rateId }) {
  return apiPost("/api/shipping/label", { shipmentId, rateId });
}

export async function trackShipment(trackingNumber) {
  const params = new URLSearchParams({ trackingNumber }).toString();
  return apiGet(`/api/shipping/track?${params}`);
}
