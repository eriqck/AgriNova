const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
const SESSION_KEY = "agrinova_session";
const MODE_KEY = "agrinova_mode";

export async function apiRequest(path, options = {}) {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    },
    body: options.body ? (isFormData ? options.body : JSON.stringify(options.body)) : undefined,
    cache: "no-store"
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Request failed.");
  }

  return payload;
}

export function saveSession(session) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    const activeMode = getActiveMode(session);
    localStorage.setItem(MODE_KEY, activeMode);
  }
}

export function clearSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(MODE_KEY);
  }
}

export function getStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(MODE_KEY);
    return null;
  }
}

export function registerUser(payload) {
  return apiRequest("/users/register", {
    method: "POST",
    body: payload
  });
}

export function loginUser(payload) {
  return apiRequest("/users/login", {
    method: "POST",
    body: payload
  });
}

export function toAssetUrl(path) {
  if (!path) {
    return "";
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_ORIGIN}${path}`;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getAvailableModes(role) {
  if (role === "FARMER") {
    return ["FARMER", "BUYER"];
  }

  if (role === "BUYER") {
    return ["BUYER"];
  }

  if (role === "ADMIN") {
    return ["ADMIN", "FARMER", "BUYER"];
  }

  return [role].filter(Boolean);
}

export function getActiveMode(session = getStoredSession()) {
  if (!session?.user?.role || typeof window === "undefined") {
    return session?.user?.role || "";
  }

  const availableModes = getAvailableModes(session.user.role);
  const storedMode = localStorage.getItem(MODE_KEY);

  if (storedMode && availableModes.includes(storedMode)) {
    return storedMode;
  }

  const defaultMode = availableModes[0] || session.user.role;
  localStorage.setItem(MODE_KEY, defaultMode);
  return defaultMode;
}

export function setActiveMode(mode, session = getStoredSession()) {
  if (typeof window === "undefined" || !mode) {
    return;
  }

  const availableModes = getAvailableModes(session?.user?.role);

  if (!availableModes.includes(mode)) {
    return;
  }

  localStorage.setItem(MODE_KEY, mode);
}

export function isBuyerMode(session = getStoredSession()) {
  const activeMode = getActiveMode(session);
  return activeMode === "BUYER" || session?.user?.role === "BUYER" || session?.user?.role === "ADMIN";
}
