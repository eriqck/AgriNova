const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
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
    localStorage.setItem("agrinova_session", JSON.stringify(session));
  }
}

export function getStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem("agrinova_session");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("agrinova_session");
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
